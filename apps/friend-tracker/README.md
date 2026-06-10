# Friend Tracker

Track hangouts with friends. Deployed to the homelab K8s cluster at `http://friend-tracker.home`.

## Local development

**Prerequisites:** Node 20, Docker (for local Postgres)

```bash
# Start a local Postgres
docker run -d --name friend-tracker-db \
  -e POSTGRES_DB=friendtracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Install deps and run migrations
npm install
npx prisma migrate dev --name init

# Start dev server
npm run dev
```

Open http://localhost:3000.

## Deploy to K8s

**1. Create the secret** (once per cluster, not committed to git):

```bash
kubectl create secret generic friend-tracker-db-secret \
  --namespace friend-tracker \
  --from-literal=POSTGRES_PASSWORD=<choose-a-password> \
  --from-literal=DATABASE_URL="postgresql://postgres:<choose-a-password>@postgres:5432/friendtracker"
```

**2. Add `/etc/hosts` entry** (on every machine that needs access):

```
<ingress-controller-IP>  friend-tracker.home
```

Get the ingress IP: `kubectl get svc -n ingress-nginx`

**3. Build and deploy:**

```bash
export GITHUB_USER=<your-github-username>
# Log in to GHCR first: echo $CR_PAT | docker login ghcr.io -u $GITHUB_USER --password-stdin
./scripts/deploy.sh
```

Replace `GITHUB_USER` in `k8s/manifests/friend-tracker.yaml` with your actual GitHub username before deploying.
