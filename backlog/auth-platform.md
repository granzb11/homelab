# Auth Platform — Keycloak SSO for Homelab Apps

## Summary

Deploy **Keycloak** as the identity provider for all homelab apps. Users log in once via Keycloak (email/password or social login) and get access to all public apps. Auth is enforced at the nginx-ingress layer via the **oauth2-proxy** sidecar — no changes to existing apps required.

This replaces the earlier plan to build a custom Next.js auth app. Keycloak is chosen because:
- Social logins (Google, GitHub, etc.) built in — no custom implementation
- MFA, user management, and admin UI out of the box
- Standard OIDC protocol — apps can integrate natively if needed
- Designed to be a public-facing identity platform

---

## Architecture

```
Browser → friends.granzb.com
  nginx-ingress: forward-auth → oauth2-proxy (validates Keycloak session)
    authenticated → pass X-Auth-Request-User, X-Auth-Request-Email headers
    unauthenticated → redirect to https://auth.granzb.com (Keycloak login)
  User logs in via Keycloak (email, Google, GitHub, etc.)
  Keycloak issues tokens → oauth2-proxy sets session cookie on .granzb.com
  Redirect back to original URL
```

### Components

| Component | Role |
|---|---|
| **Keycloak** | Identity provider — login UI, user DB, social logins, MFA, admin console |
| **oauth2-proxy** | Nginx forward-auth adapter — validates Keycloak tokens, sets session cookies |
| **Postgres** | Keycloak's backing database |

---

## Keycloak K8s Deployment

**Namespace:** `keycloak`

**Image:** `quay.io/keycloak/keycloak:latest` (or pin to a specific version)

**Startup command:** `start` with `--optimized` flag for production, or `start-dev` for initial local setup.

**Resource needs:** Keycloak is heavier than a Next.js app — plan for:
- Requests: `cpu: 200m / memory: 512Mi`
- Limits: `cpu: 1000m / memory: 1Gi`

**Env vars (from K8s Secret):**
```
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres.keycloak.svc.cluster.local:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=<secret>
KC_HOSTNAME=auth.granzb.com
KC_PROXY=edge           # nginx is the TLS terminator
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<secret>
```

**Ingress hosts:**
- `auth.home` — local admin access
- `auth.granzb.com` — public login endpoint (Cloudflare Tunnel)

---

## oauth2-proxy Deployment

**Namespace:** `oauth2-proxy`

**Image:** `quay.io/oauth2-proxy/oauth2-proxy:latest`

**Config (env vars from Secret):**
```
OAUTH2_PROXY_PROVIDER=keycloak-oidc
OAUTH2_PROXY_OIDC_ISSUER_URL=https://auth.granzb.com/realms/homelab
OAUTH2_PROXY_CLIENT_ID=oauth2-proxy
OAUTH2_PROXY_CLIENT_SECRET=<from Keycloak client config>
OAUTH2_PROXY_COOKIE_SECRET=<random 32-byte base64>
OAUTH2_PROXY_COOKIE_DOMAIN=.granzb.com
OAUTH2_PROXY_EMAIL_DOMAINS=*
OAUTH2_PROXY_UPSTREAMS=static://202     # just validates auth, doesn't proxy traffic
OAUTH2_PROXY_HTTP_ADDRESS=0.0.0.0:4180
OAUTH2_PROXY_REVERSE_PROXY=true
OAUTH2_PROXY_SET_XAUTHREQUEST=true      # emits X-Auth-Request-User, X-Auth-Request-Email
```

**Service:** ClusterIP on port 4180, named `oauth2-proxy.oauth2-proxy.svc.cluster.local`

---

## nginx-ingress Annotations (per protected app)

Add to `.granzb.com` Ingress rules only — leave `.home` rules unauthenticated:

```yaml
nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local:4180/oauth2/auth"
nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.granzb.com/oauth2/start?rd=$scheme://$host$request_uri"
nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User,X-Auth-Request-Email,X-Auth-Request-Access-Token"
```

Also expose oauth2-proxy itself via Ingress at `oauth2-proxy.granzb.com` (handles `/oauth2/` callback routes).

Apps to gate:
- `k8s/manifests/friend-tracker.yaml`
- `k8s/manifests/trip-tracker.yaml`
- `k8s/manifests/michelin-tracker.yaml` (when it exists)

---

## Keycloak Realm Setup (manual, post-deploy)

1. Log into `https://auth.granzb.com` as admin
2. Create realm: `homelab`
3. Create client: `oauth2-proxy`
   - Client type: OpenID Connect
   - Client authentication: ON (confidential)
   - Valid redirect URIs: `https://oauth2-proxy.granzb.com/oauth2/callback`
   - Web origins: `https://*.granzb.com`
4. Copy client secret → update oauth2-proxy Secret
5. Add Identity Providers (social logins):
   - **Google**: create OAuth app at console.developers.google.com → add as Keycloak IdP
   - **GitHub**: create OAuth app at github.com/settings/developers → add as Keycloak IdP
6. Enable email verification and set up SMTP if desired

---

## K8s Secrets (create manually, never commit)

```bash
# Keycloak
kubectl create secret generic keycloak-secret \
  --namespace keycloak \
  --from-literal=KC_DB_PASSWORD=<choose> \
  --from-literal=KEYCLOAK_ADMIN_PASSWORD=<choose>

# Postgres for Keycloak
kubectl create secret generic keycloak-postgres-secret \
  --namespace keycloak \
  --from-literal=POSTGRES_PASSWORD=<same as KC_DB_PASSWORD> \
  --from-literal=POSTGRES_USER=keycloak \
  --from-literal=POSTGRES_DB=keycloak

# oauth2-proxy
kubectl create secret generic oauth2-proxy-secret \
  --namespace oauth2-proxy \
  --from-literal=OAUTH2_PROXY_CLIENT_SECRET=<from Keycloak> \
  --from-literal=OAUTH2_PROXY_COOKIE_SECRET=$(openssl rand -base64 32)
```

---

## Files to Create

```
k8s/manifests/keycloak.yaml          # Namespace + Postgres + Keycloak Deployment + Service + Ingress
k8s/manifests/oauth2-proxy.yaml      # Namespace + oauth2-proxy Deployment + Service + Ingress
```

## Files to Modify

- `k8s/manifests/friend-tracker.yaml` — add auth annotations to granzb.com Ingress rule
- `k8s/manifests/trip-tracker.yaml` — same
- `/etc/hosts` — add `auth.home` and `oauth2-proxy.home`

---

## Cloudflare Tunnel Routes to Add

| Subdomain | Service URL |
|---|---|
| `auth` | `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local:80` |
| `oauth2-proxy` | `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local:80` |

---

## Implementation Steps

1. Deploy Keycloak + Postgres (`keycloak.yaml`)
2. Add `auth.home` to `/etc/hosts`, verify admin console loads
3. Add Cloudflare Tunnel routes for `auth.granzb.com` and `oauth2-proxy.granzb.com`
4. Configure realm + client in Keycloak admin UI
5. Deploy oauth2-proxy (`oauth2-proxy.yaml`) with client secret from step 4
6. Add auth annotations to friend-tracker and trip-tracker manifests, re-apply
7. Test end-to-end: visit `https://friends.granzb.com` → redirect to Keycloak → login → back to app
8. Add Google and GitHub as social login providers
