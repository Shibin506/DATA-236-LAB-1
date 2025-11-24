#!/bin/bash

echo "🚀 Deploying Airbnb Application to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if minikube is running (if using minikube)
if command -v minikube &> /dev/null; then
    if ! minikube status &> /dev/null; then
        echo "📦 Starting Minikube..."
        minikube start
    fi
    echo "✅ Using Minikube Kubernetes cluster"
else
    echo "✅ Using default Kubernetes cluster"
fi

# Create namespace
echo "📋 Creating namespace..."
kubectl apply -f deploy/k8s/namespace.yaml

# Apply ConfigMaps and Secrets
echo "🔧 Applying ConfigMaps..."
kubectl apply -f deploy/k8s/configmap-backend.yaml

# Deploy Backend
echo "🔨 Deploying Backend..."
kubectl apply -f deploy/k8s/deployment-backend.yaml
kubectl apply -f deploy/k8s/service-backend.yaml

# Deploy Frontend (if exists)
if [ -f "deploy/k8s/deployment-frontend.yaml" ]; then
    echo "🎨 Deploying Frontend..."
    kubectl apply -f deploy/k8s/deployment-frontend.yaml
    kubectl apply -f deploy/k8s/service-frontend.yaml
fi

# Deploy AgentAI
echo "🤖 Deploying AgentAI..."
kubectl apply -f deploy/k8s/deployment-agentai.yaml
kubectl apply -f deploy/k8s/service-agentai.yaml

# Apply Ingress (optional)
if [ -f "deploy/k8s/ingress.yaml" ]; then
    echo "🌐 Applying Ingress..."
    kubectl apply -f deploy/k8s/ingress.yaml
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Checking deployment status..."
kubectl get pods -n travel-platform
echo ""
echo "🌐 Services:"
kubectl get services -n travel-platform
echo ""
echo "📝 To view logs:"
echo "   kubectl logs -f deployment/backend -n travel-platform"
echo "   kubectl logs -f deployment/agentai -n travel-platform"
echo ""
echo "🔗 To access services:"
echo "   Backend:  kubectl port-forward -n travel-platform svc/backend 3001:3001"
echo "   AgentAI:  kubectl port-forward -n travel-platform svc/agentai 5000:5000"
