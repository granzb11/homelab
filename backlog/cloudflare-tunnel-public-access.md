# Cloudflare Tunnel — Public App Access

## Summary
Set up Cloudflare Tunnel to expose homelab apps publicly without opening router ports or revealing the home IP.

## Prerequisites
- [x] Register a domain through Cloudflare — purchased **granzb.com**
- [x] Cloudflare account with domain DNS managed by Cloudflare

## Tasks
- [x] Create a Cloudflare Tunnel via the dashboard — tunnel **homelab**
- [x] Deploy `cloudflared` as a pod in the k8s cluster (2 replicas, `cloudflared` namespace)
- [x] Wire `cloudflared` to nginx-ingress so existing Ingress manifests work for public access
- [x] Test public access — verified `https://friends.granzb.com` working

## Notes
- Traffic routes through Cloudflare's edge (outbound connection, no inbound ports needed)
- Works behind CGNAT
- Automatic HTTPS via Cloudflare
- Local `/etc/hosts` setup remains unchanged for local access
