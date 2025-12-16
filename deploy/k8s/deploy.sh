#!/bin/bash

# Kubernetes Deployment Script for HostIQ Application
# This script builds Docker images and deploys them to Kubernetes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl first."
    echo "Enable Kubernetes in Docker Desktop or install minikube"
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    print_error "Kubernetes cluster is not running"
    echo "Please start Kubernetes in Docker Desktop or run 'minikube start'"
    exit 1
fi

print_success "Kubernetes cluster is running"

# Step 1: Build Docker Images
print_info "Step 1/5: Building Docker images..."

cd "$(dirname "$0")/.."

print_info "Building Backend image..."
docker build -t airbnb-backend:latest ./Backend

print_info "Building Frontend image..."
docker build -t airbnb-frontend:latest ./Frontend

print_info "Building AgentAI image..."
docker build -t airbnb-agentai:latest ./AgentAI

print_success "All Docker images built successfully"

# Step 2: Create Namespace
print_info "Step 2/5: Creating Kubernetes namespace..."
kubectl apply -f deploy/k8s/00-namespace.yaml
print_success "Namespace created"

# Step 3: Create Secrets and ConfigMaps
print_info "Step 3/5: Creating secrets and configmaps..."
kubectl apply -f deploy/k8s/01-secrets.yaml
kubectl apply -f deploy/k8s/02-configmaps.yaml
print_success "Secrets and ConfigMaps created"

# Step 4: Create Storage
print_info "Step 4/5: Creating persistent volumes..."
kubectl apply -f deploy/k8s/03-storage.yaml
print_success "Storage created"

# Step 5: Deploy Services
print_info "Step 5/5: Deploying services..."

print_info "Deploying Zookeeper..."
kubectl apply -f deploy/k8s/04-zookeeper.yaml

print_info "Waiting for Zookeeper to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/zookeeper -n hostiq

print_info "Deploying Kafka..."
kubectl apply -f deploy/k8s/05-kafka.yaml

print_info "Waiting for Kafka to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/kafka -n hostiq

print_info "Deploying MySQL..."
kubectl apply -f deploy/k8s/06-mysql.yaml

print_info "Waiting for MySQL to be ready..."
kubectl wait --for=condition=available --timeout=180s deployment/mysql -n hostiq

print_info "Deploying Backend..."
kubectl apply -f deploy/k8s/07-backend.yaml

print_info "Deploying AgentAI..."
kubectl apply -f deploy/k8s/08-agentai.yaml

print_info "Deploying Frontend..."
kubectl apply -f deploy/k8s/09-frontend.yaml

print_info "Creating Ingress..."
kubectl apply -f deploy/k8s/10-ingress.yaml

print_success "All services deployed successfully!"

# Wait for all deployments to be ready
print_info "Waiting for all deployments to be ready (this may take a few minutes)..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n hostiq
kubectl wait --for=condition=available --timeout=300s deployment/agentai -n hostiq
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n hostiq

print_success "All deployments are ready!"

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n hostiq"
echo ""
echo "Check services:"
echo "  kubectl get services -n hostiq"
echo ""
echo "View logs:"
echo "  kubectl logs -f deployment/backend -n hostiq"
echo "  kubectl logs -f deployment/agentai -n hostiq"
echo "  kubectl logs -f deployment/frontend -n hostiq"
echo ""
echo "Access the application:"
echo "  Frontend: kubectl port-forward svc/frontend-service 8080:80 -n hostiq"
echo "  Backend:  kubectl port-forward svc/backend-service 3001:3001 -n hostiq"
echo "  AgentAI:  kubectl port-forward svc/agentai-service 8000:8000 -n hostiq"
echo ""
echo "Or get the LoadBalancer IP:"
echo "  kubectl get svc frontend-service -n hostiq"
echo ""
