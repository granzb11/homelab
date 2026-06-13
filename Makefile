.PHONY: help \
	deploy-friend-tracker deploy-trip-tracker deploy-michelin-tracker \
	deploy-keycloak deploy-postgres deploy-cloudflared deploy-oauth2-proxy \
	apply-friend-tracker apply-trip-tracker apply-michelin-tracker \
	restart-% logs-% delete-% kubectl-status setup

help:
	@echo "Homelab Makefile targets:"
	@echo ""
	@echo "App deploy (build image + apply manifest + rollout):"
	@echo "  make deploy-friend-tracker    Build & deploy friend-tracker"
	@echo "  make deploy-trip-tracker      Build & deploy trip-tracker"
	@echo "  make deploy-michelin-tracker  Build & deploy michelin-tracker"
	@echo ""
	@echo "  Use these after CODE changes — they rebuild the local image."
	@echo "  (The image tag is :latest with imagePullPolicy: Never, so a"
	@echo "   bare 'kubectl apply' would NOT pick up code changes.)"
	@echo ""
	@echo "Manifest-only apply (no image rebuild):"
	@echo "  make apply-friend-tracker     Re-apply friend-tracker manifest"
	@echo "  make apply-trip-tracker       Re-apply trip-tracker manifest"
	@echo "  make apply-michelin-tracker   Re-apply michelin-tracker manifest"
	@echo ""
	@echo "  Use these for manifest-only changes (env, resources, ingress)."
	@echo ""
	@echo "Infra deploy (public images — apply is enough):"
	@echo "  make deploy-keycloak          Apply keycloak manifest"
	@echo "  make deploy-postgres          Apply postgres manifest"
	@echo "  make deploy-cloudflared       Apply cloudflared manifest"
	@echo "  make deploy-oauth2-proxy      Apply oauth2-proxy manifest"
	@echo ""
	@echo "Pod management:"
	@echo "  make restart-<app>            Restart a deployment"
	@echo "  make logs-<app>               Tail pod logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make delete-<app>             Delete the app's namespace"
	@echo ""
	@echo "Utilities:"
	@echo "  make kubectl-status           Show ingress status"
	@echo "  make setup                    Run initial cluster setup"

# ---------------------------------------------------------------------------
# App deploy — builds the local Docker image, applies the manifest, and rolls
# out a fresh deployment. Required after any code change because the apps run
# locally-built images (image: <app>:latest, imagePullPolicy: Never).
# ---------------------------------------------------------------------------
deploy-friend-tracker:
	apps/friend-tracker/scripts/deploy.sh

deploy-trip-tracker:
	apps/trip-tracker/scripts/deploy.sh

deploy-michelin-tracker:
	docker build -t michelin-tracker:latest apps/michelin-tracker
	kubectl apply -f k8s/manifests/michelin-tracker.yaml
	kubectl rollout restart deployment/michelin-tracker -n michelin-tracker
	kubectl rollout status deployment/michelin-tracker -n michelin-tracker

# ---------------------------------------------------------------------------
# Manifest-only apply — for env/resource/ingress changes that don't touch app
# code. Does NOT rebuild the image. Restart separately if the running pod must
# pick up the manifest change.
# ---------------------------------------------------------------------------
apply-friend-tracker:
	kubectl apply -f k8s/manifests/friend-tracker.yaml

apply-trip-tracker:
	kubectl apply -f k8s/manifests/trip-tracker.yaml

apply-michelin-tracker:
	kubectl apply -f k8s/manifests/michelin-tracker.yaml

# ---------------------------------------------------------------------------
# Infra deploy — these use public images, so applying the manifest is enough.
# ---------------------------------------------------------------------------
deploy-keycloak:
	kubectl apply -f k8s/manifests/keycloak.yaml

deploy-postgres:
	kubectl apply -f k8s/manifests/postgres.yaml

deploy-cloudflared:
	kubectl apply -f k8s/manifests/cloudflared.yaml

deploy-oauth2-proxy:
	kubectl apply -f k8s/manifests/oauth2-proxy.yaml

# ---------------------------------------------------------------------------
# Pod management — restart-<app> and logs-<app> work for any app whose
# deployment name matches its namespace.
# ---------------------------------------------------------------------------
restart-%:
	kubectl rollout restart deployment/$* -n $*

logs-%:
	kubectl logs -n $* deploy/$* -f

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
delete-%:
	kubectl delete namespace $*

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
kubectl-status:
	kubectl get svc -n ingress-nginx ingress-nginx-controller

setup:
	bash k8s/setup.sh
