#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building trip-tracker Docker image..."
docker build -t trip-tracker:latest .

echo "==> Applying K8s manifest..."
kubectl apply -f ../../k8s/manifests/trip-tracker.yaml

echo "==> Restarting deployment..."
kubectl rollout restart deployment/trip-tracker -n trip-tracker

echo "==> Waiting for rollout..."
kubectl rollout status deployment/trip-tracker -n trip-tracker

echo ""
echo "Done. Open http://trip-tracker.home"
echo ""
echo "If this is a first deploy, create the secret and add the hostname:"
echo "  kubectl create secret generic trip-tracker-db-secret \\"
echo "    --from-literal=POSTGRES_PASSWORD=<password> \\"
echo "    --from-literal=DATABASE_URL='postgresql://postgres:<password>@postgres.trip-tracker.svc.cluster.local:5432/triptracker' \\"
echo "    -n trip-tracker"
echo ""
echo "  INGRESS_IP=\$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "  echo \"\$INGRESS_IP  trip-tracker.home\" | sudo tee -a /etc/hosts"
