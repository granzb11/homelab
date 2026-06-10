# Homelab Kubernetes Setup

Local Kubernetes on a Mac Mini (Apple Silicon) using OrbStack. Apps run in the cluster and are accessible at `*.home` hostnames on this machine.

---

## First-time setup

### 1. Run the setup script

```bash
bash k8s/setup.sh
```

This installs Homebrew (if missing), OrbStack, Helm, and nginx-ingress. It will pause and ask you to enable Kubernetes in OrbStack before continuing.

**Enabling Kubernetes in OrbStack:**
1. Open OrbStack from Applications
2. Go to Settings → Kubernetes
3. Toggle Enable Kubernetes
4. Wait for the green "Running" status in the menu bar

### 2. Add app hostnames to /etc/hosts

After setup, the script prints the nginx-ingress IP. Add entries like this for each app:

```bash
echo "192.168.139.2  hello.home" | sudo tee -a /etc/hosts
```

Replace the IP with whatever the script printed. Check the current ingress IP at any time with:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

---

## Deploying apps

Each app lives in `k8s/manifests/<app-name>.yaml` and follows this pattern:

- `Namespace` — isolates the app
- `Deployment` — runs the container(s)
- `Service` — internal ClusterIP routing
- `Ingress` — exposes the app at a `*.home` hostname via nginx-ingress

Apply any app with:

```bash
kubectl apply -f k8s/manifests/<app-name>.yaml
```

Then add its hostname to `/etc/hosts` (see above).

---

## File structure

```
k8s/
├── setup.sh                  # One-time cluster setup
└── manifests/
    └── test-app.yaml         # hello-world smoke test (hello.home)
```

---

## Useful commands

```bash
# List all running pods across namespaces
kubectl get pods -A

# Check CronJob history
kubectl get jobs -n icloud-sync

# Delete all completed/failed icloud sync jobs
kubectl delete jobs -n icloud-sync --field-selector status.successful=1
kubectl delete jobs -n icloud-sync --field-selector status.failed=1

# Restart a deployment
kubectl rollout restart deployment/<name> -n <namespace>
```
