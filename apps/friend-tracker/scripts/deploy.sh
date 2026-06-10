#!/usr/bin/env bash
set -euo pipefail

IMAGE="friend-tracker:latest"
MANIFEST="../../k8s/manifests/friend-tracker.yaml"

cd "$(dirname "$0")/.."

echo "Building image..."
docker build -t "$IMAGE" .

echo "Applying manifests..."
kubectl apply -f "$MANIFEST"

echo "Restarting deployment..."
kubectl rollout restart deployment/friend-tracker -n friend-tracker
kubectl rollout status deployment/friend-tracker -n friend-tracker

echo "Done. App available at http://friend-tracker.home"
