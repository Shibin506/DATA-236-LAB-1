#!/bin/bash

# Script to clean up Kubernetes deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}This will delete all Kubernetes resources in the 'hostiq' namespace${NC}"
read -p "Are you sure? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Deleting all resources...${NC}"
    
    kubectl delete -f deploy/k8s/10-ingress.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/09-frontend.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/08-agentai.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/07-backend.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/06-mysql.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/05-kafka.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/04-zookeeper.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/03-storage.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/02-configmaps.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/01-secrets.yaml --ignore-not-found=true
    kubectl delete -f deploy/k8s/00-namespace.yaml --ignore-not-found=true
    
    echo -e "${GREEN}✓ All resources deleted${NC}"
else
    echo "Cleanup cancelled"
fi
