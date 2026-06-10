#!/bin/bash
set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${BLUE}==>${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
die()  { echo -e "${RED}✗${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 1. Homebrew ────────────────────────────────────────────────────────────────
step "Checking Homebrew..."
if ! command -v brew &>/dev/null; then
  warn "Homebrew not found — installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
fi
ok "Homebrew ready"

# ── 2. OrbStack ───────────────────────────────────────────────────────────────
step "Checking OrbStack..."
if ! command -v orb &>/dev/null; then
  brew install --cask orbstack
  echo ""
  warn "OrbStack installed. Complete these steps before continuing:"
  warn "  1. Open OrbStack from Applications (or Spotlight)"
  warn "  2. Settings → Kubernetes → toggle Enable Kubernetes"
  warn "  3. Wait for the green 'Running' status in the menu bar"
  echo ""
  read -rp "Press Enter once Kubernetes shows 'Running' in OrbStack..."
else
  ok "OrbStack already installed"
fi

# ── 3. kubectl context ────────────────────────────────────────────────────────
step "Verifying cluster connection..."
if ! kubectl cluster-info &>/dev/null 2>&1; then
  die "Cannot reach cluster. Make sure Kubernetes is enabled in OrbStack."
fi
ok "Connected to: $(kubectl config current-context)"

# ── 4. Helm ───────────────────────────────────────────────────────────────────
step "Checking Helm..."
if ! command -v helm &>/dev/null; then
  brew install helm
fi
ok "Helm $(helm version --short) ready"

# ── 5. nginx-ingress ──────────────────────────────────────────────────────────
step "Installing nginx-ingress controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
helm repo update ingress-nginx

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --wait \
  --timeout=120s
ok "nginx-ingress installed"

# ── 6. Resolve ingress IP ─────────────────────────────────────────────────────
step "Resolving ingress address..."
INGRESS_IP=""
for i in $(seq 1 30); do
  INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  [[ -n "$INGRESS_IP" ]] && break
  sleep 1
done
if [[ -z "$INGRESS_IP" ]]; then
  warn "LoadBalancer IP not assigned yet — falling back to ClusterIP"
  INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
    -o jsonpath='{.spec.clusterIP}')
fi
ok "Ingress IP: $INGRESS_IP"

# ── 7. Deploy test app ────────────────────────────────────────────────────────
step "Deploying test app..."
kubectl apply -f "$SCRIPT_DIR/manifests/test-app.yaml"
kubectl rollout status deployment/hello-world -n hello-world --timeout=60s
ok "Test app deployed"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}All done!${NC}"
echo ""
echo "Add to /etc/hosts on this Mac:"
echo "  $INGRESS_IP  hello.home"
echo ""
echo "Then visit: http://hello.home"
