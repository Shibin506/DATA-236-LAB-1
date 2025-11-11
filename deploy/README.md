# Deploy: Docker & Kubernetes

This directory contains Docker and Kubernetes configuration to run the Lab 1 platform as services:

- Traveler service (logical): served by Backend API
- Owner service (logical): served by Backend API
- Property service: served by Backend API
- Booking service: served by Backend API
- Agentic AI service: FastAPI microservice

The Backend image exposes route groups and can be sliced by role via `SERVICE_ROLE`.

## 1) Build Docker images

Replace `ghcr.io/your-org` with your container registry (Docker Hub, GHCR, etc.).

```bash
# Backend (Node)
cd Backend
# Build a production bundle and image
docker build -t ghcr.io/your-org/airbnb-backend:latest .

# AgentAI (FastAPI)
cd ../AgentAI
docker build -t ghcr.io/your-org/agentai:latest .
```

Optional: push images to your registry.

```bash
docker push ghcr.io/your-org/airbnb-backend:latest
docker push ghcr.io/your-org/agentai:latest
```

## 2) Kubernetes deploy

Requirements:
- A running cluster (kind/minikube/AKS/GKE/etc.)
- kubectl configured for the cluster
- NGINX Ingress Controller if using `ingress.yaml`

Apply manifests:

```bash
kubectl apply -f deploy/k8s/namespace.yaml
# Create your secret from the example (avoid committing real secrets):
# cp deploy/k8s/secret-db.example.yaml deploy/k8s/secret-db.yaml && edit DB_PASSWORD
kubectl apply -f deploy/k8s/secret-db.yaml
kubectl apply -f deploy/k8s/configmap-backend.yaml
kubectl apply -f deploy/k8s/deployment-backend.yaml
kubectl apply -f deploy/k8s/service-backend.yaml
kubectl apply -f deploy/k8s/deployment-agentai.yaml
kubectl apply -f deploy/k8s/service-agentai.yaml
# Logical role services (all point to backend-api for now)
kubectl apply -f deploy/k8s/services-per-role.yaml
# Optional Ingress
kubectl apply -f deploy/k8s/ingress.yaml
```

## 3) Scale services

```bash
# Scale backend API
kubectl -n travel-platform scale deployment backend-api --replicas=3

# Scale AgentAI
kubectl -n travel-platform scale deployment agentai --replicas=2
```

## 4) Service discovery & communication

- Backend service DNS: `backend-api.travel-platform.svc.cluster.local:3001`
- AgentAI service DNS: `agentai.travel-platform.svc.cluster.local:8000`
- Logical services resolving to backend:
  - `traveler-service.travel-platform.svc.cluster.local`
  - `owner-service.travel-platform.svc.cluster.local`
  - `property-service.travel-platform.svc.cluster.local`
  - `booking-service.travel-platform.svc.cluster.local`

Set env in your apps to call other services by DNS name above. The Backend `server.js` supports `SERVICE_ROLE` to limit routes per deployment if you later split pods by role.

## 5) Environment configuration

- `deploy/k8s/configmap-backend.yaml` defines non-secret env vars (DB host/name/user/port, CORS origin).
- `deploy/k8s/secret-db.yaml` stores `DB_PASSWORD` (change the value!).
- Ensure your MySQL is reachable at the host defined in the ConfigMap (default `mysql`). If you don't have MySQL in-cluster, set `DB_HOST` to an external endpoint and open network access.

## 6) Ingress (optional)

If an ingress controller is installed:
- Backend: `http://localhost/api/health`
- AgentAI: `http://localhost/agent/api/v1/diagnostics` or `http://localhost/agent/health`

## Notes

- The Backend image already exists in this repo (Backend/Dockerfile). The AgentAI Dockerfile was added.
- For a true microservices split, create separate deployments with `SERVICE_ROLE=traveler|owner|property|booking` all using the same image and selector label per role. You can also split code later.
- For database bootstrapping, run the provided Node scripts manually or mount an init job; schema creation is handled by the backend on startup.
