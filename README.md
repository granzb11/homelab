# homelab

Personal homelab running on a Mac Mini (Apple Silicon). Local web apps are deployed to a lightweight Kubernetes cluster and accessible at `*.home` hostnames on the LAN. Selected apps are also exposed publicly via Cloudflare Tunnel at `*.granzb.com`.

## Stack

| Layer | Tool | Role |
|---|---|---|
| Container runtime + K8s | **OrbStack** | Lightweight local cluster on macOS |
| Ingress controller | **nginx-ingress** (via Helm) | Routes `*.home` traffic by hostname |
| DNS | `/etc/hosts` | Maps `<app>.home` → ingress LAN IP |
| Public access | **Cloudflare Tunnel** | Exposes apps at `*.granzb.com` over HTTPS |
| App manifests | `k8s/manifests/<app>.yaml` | One file per app: Namespace + Deployment + Service + Ingress |

## Apps

| App | Local | Public |
|---|---|---|
| friend-tracker | `friend-tracker.home` | `friends.granzb.com` |
| michelin-tracker | `michelin.home` | `michelin.granzb.com` |

## Setup

Run once on a fresh machine:

```bash
bash k8s/setup.sh
```

This installs Homebrew, OrbStack, kubectl, Helm, and nginx-ingress. It pauses to let you enable Kubernetes in OrbStack before continuing.

After the script finishes, add the ingress IP to `/etc/hosts`:

```bash
# Get the ingress IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Add each app hostname
echo "<IP>  hello.home" | sudo tee -a /etc/hosts
```

Visit `http://hello.home` to confirm the stack is working.

## Deploying a new app

1. Create `k8s/manifests/<app-name>.yaml` — follow the pattern in an existing manifest:
   - `Namespace` named after the app
   - `Deployment` pointing to a public container image
   - `ClusterIP` Service
   - `Ingress` with `ingressClassName: nginx` and host `<app>.home`

2. Apply and add the hostname:
   ```bash
   kubectl apply -f k8s/manifests/<app-name>.yaml
   echo "<ingress-IP>  <app-name>.home" | sudo tee -a /etc/hosts
   ```

3. Verify:
   ```bash
   kubectl rollout status deployment/<name> -n <namespace>
   ```

### Exposing an app publicly

The `homelab` Cloudflare Tunnel is already running. To add a public route:

1. In the Cloudflare dashboard: Zero Trust → Networks → Tunnels → homelab → Add route
   - Subdomain: `<app>`, Domain: `granzb.com`
   - Service URL: `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local:80`

2. Add the public host to the `Ingress` rules in the app's manifest and re-apply.

See `backlog/cloudflare-tunnel-public-access.md` for full details.

### Apps with a database

Apps that need Postgres store credentials in a K8s secret (never committed). Create the secret before applying the manifest — instructions are in the comments at the top of each manifest file.

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

## Repo structure

```
homelab/
├── k8s/
│   ├── setup.sh              # One-time cluster bootstrap
│   └── manifests/
│       ├── cloudflared.yaml  # Cloudflare Tunnel connector (2 replicas)
│       ├── friend-tracker.yaml
│       ├── michelin-tracker.yaml
│       └── postgres.yaml
├── apps/
│   ├── friend-tracker/       # App source
│   └── michelin-tracker/     # App source
├── backlog/                  # Notes and docs
└── CLAUDE.md                 # Claude Code context
```
