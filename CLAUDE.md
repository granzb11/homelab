# Homelab – Claude Code Context

This repo is a personal homelab on a **Mac Mini (Apple Silicon)**. Its primary purpose is to let Claude Code build and deploy local web apps that are immediately accessible in a browser via `*.home` hostnames.

---

## How the local deployment stack works

### The pieces

| Layer | Tool | Role |
|---|---|---|
| Container runtime + Kubernetes | **OrbStack** | Runs a lightweight local K8s cluster. No Docker Desktop needed. |
| Package manager for K8s | **Helm** | Used to install the ingress controller. |
| HTTP routing | **nginx-ingress** | A LoadBalancer service inside the cluster. OrbStack assigns it a real LAN IP, so traffic to `*.home` hostnames reaches apps in the cluster. |
| DNS | **/etc/hosts** | Maps `<app>.home` → the nginx-ingress IP. Must be updated manually for each new app. |
| App manifests | `k8s/manifests/<app>.yaml` | Each app is a single YAML file containing Namespace + Deployment + Service + Ingress. |

### Traffic flow

```
Browser → http://<app>.home
    ↓  /etc/hosts resolves hostname → ingress IP
    ↓  nginx-ingress routes by Host header
    ↓  ClusterIP Service
    ↓  Pod(s) in <app> Namespace
```

### First-time setup

Run once on a fresh machine:

```bash
bash k8s/setup.sh
```

The script handles: Homebrew → OrbStack install → kubectl connectivity check → Helm → nginx-ingress (via Helm) → test-app smoke test. It pauses and asks you to enable Kubernetes in OrbStack before proceeding.

After the script finishes, add the ingress IP to `/etc/hosts`:

```bash
# The script prints the IP. Check it any time with:
kubectl get svc -n ingress-nginx ingress-nginx-controller
# Then:
echo "<IP>  hello.home" | sudo tee -a /etc/hosts
```

Visit `http://hello.home` to confirm the stack is working.

---

## Deploying a new app

1. **Create a manifest** at `k8s/manifests/<app-name>.yaml`. Follow the pattern in `k8s/manifests/test-app.yaml`:
   - `Namespace` named after the app
   - `Deployment` pointing to a public container image
   - `ClusterIP` Service
   - `Ingress` with `ingressClassName: nginx` and host `<app>.home`

2. **Apply it:**
   ```bash
   kubectl apply -f k8s/manifests/<app-name>.yaml
   ```

3. **Add the hostname** (use the same ingress IP — no need to look it up again):
   ```bash
   echo "<ingress-IP>  <app>.home" | sudo tee -a /etc/hosts
   ```

4. **Open** `http://<app>.home` in the browser.

### Exposing an app publicly via Cloudflare Tunnel (optional)

The homelab tunnel (`homelab`) is already running and connected. To make an app accessible at `https://<app>.granzb.com`:

1. **Add a Cloudflare route** in the dashboard: Zero Trust → Networks → Tunnels → homelab → Add route → Published application
   - Subdomain: `<app>`
   - Domain: `granzb.com`
   - Service URL: `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local:80`

2. **Add the public host to the Ingress** in `k8s/manifests/<app-name>.yaml`:
   ```yaml
   rules:
   - host: <app>.home        # existing local rule
     http: ...
   - host: <app>.granzb.com  # new public rule (same backend)
     http:
       paths:
       - path: /
         pathType: Prefix
         backend:
           service:
             name: <app>
             port:
               number: <port>
   ```

3. **Re-apply the manifest:**
   ```bash
   kubectl apply -f k8s/manifests/<app-name>.yaml
   ```

Cloudflare handles HTTPS automatically — no cert setup needed.

---

## Useful commands

```bash
# Current ingress IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# All running pods
kubectl get pods -A

# Restart a deployment
kubectl rollout restart deployment/<name> -n <namespace>

# Tail pod logs
kubectl logs -n <namespace> deploy/<name> -f

# Delete an app entirely
kubectl delete namespace <app-name>
```

---

## Repo structure

```
homelab/
├── CLAUDE.md              # This file — Claude Code context
├── k8s/
│   ├── setup.sh           # One-time cluster bootstrap
│   ├── README.md          # Human-readable setup guide
│   └── manifests/
│       └── test-app.yaml  # hello-world smoke test (hello.home)
└── jira/                  # Unrelated Jira tooling
```

---

## Design principles for Claude-built apps

All new apps must follow the **Impeccable Design** system. Full reference files live at `/Users/gustavoranz/code/impeccable-design/` — read `DESIGN.md` and `codex.md` before building any UI.

### Core identity: "The Botanical Workbench"
Warm, precise, developer-native. Clean surfaces with a live botanical palette. Not a startup template, not a spartan terminal — a well-equipped personal workshop with character.

### Colors
- **Botanical Moss** (deep olive-green, oklch ~L0.35 C0.11 H140°): primary interactive elements only — buttons, active states, focused controls. Never decorative.
- **Warm Amber** (oklch ~L0.63 C0.15 H60°): badges, status indicators, secondary accents.
- **Ink** (near-black with whisper of moss hue): all text. ≥7:1 contrast against surface.
- **Surface**: pure white `oklch(1.000 0.000 0)`. No tinting.
- **Muted**: ink pulled ~40% toward bg for metadata, labels, placeholders.
- **The Craft Rule**: warmth lives in Moss and Amber — never in the background. The cream/sand/beige/parchment band is prohibited. If the bg reads warm, it's wrong.

### Typography
- **Two voices only**: a warm display face (e.g. Fraunces, DM Serif Display) for headings, and a monospace face (e.g. Geist Mono, JetBrains Mono) for everything else. No sans-serif intermediary — ever.
- Display headings: `clamp(2.5rem, 6vw, 4.5rem)`, line-height ~1.05, letter-spacing ≥ -0.03em.
- Body is monospace at `1rem`, line-height 1.65, capped at 65–75ch.
- Labels: mono, `0.75–0.875rem`. No all-caps except badges ≤4 chars.

### Elevation & motion
- **Flat at rest**: no drop shadows on cards, panels, or buttons in default state.
- Depth via tonal layering, not shadows.
- State changes (hover, focus, active): smooth ease-out transitions ~150–200ms.
- Always include `@media (prefers-reduced-motion: reduce)` alternatives.

### Hard don'ts
- No gradient text (`background-clip: text`)
- No glassmorphism, no hero metric grids, no gradient surfaces
- No side-stripe border accents on cards/alerts
- No tinted backgrounds (cream, sand, beige, parchment, linen)
- No drop shadows on resting surfaces
- No third typeface
- No scroll-jacking or cursor effects

---

## Conventions for Claude-built apps

- One manifest file per app in `k8s/manifests/`.
- Hostname format: `<app-name>.home`.
- Use public container images (Docker Hub, ghcr.io) — the cluster has no local registry.
- Resource requests/limits: start with `cpu: 50m / memory: 64Mi` requests and `cpu: 200m / memory: 128Mi` limits; adjust if the app needs more.
- After deploying, always verify with `kubectl rollout status deployment/<name> -n <namespace>`.
