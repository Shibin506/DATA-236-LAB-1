#!/bin/bash

# Airbnb Docker Management Script
# Usage: ./docker-manage.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${GREEN}ℹ $1${NC}"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env file created. Please review and update it."
        else
            print_error ".env.example not found!"
            exit 1
        fi
    fi
}

# Build all services
build() {
    print_info "Building all Docker services..."
    docker compose build --no-cache
    print_success "All services built successfully!"
}

# Start all services
start() {
    check_env
    print_info "Starting all services..."
    docker compose up -d
    print_success "All services started!"
    echo ""
    status
}

# Stop all services
stop() {
    print_info "Stopping all services..."
    docker compose down
    print_success "All services stopped!"
}

# Restart all services
restart() {
    stop
    start
}

# Show service status
status() {
    print_info "Service Status:"
    docker compose ps
    echo ""
    print_info "Access URLs:"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:3001/health"
    echo "  AgentAI:   http://localhost:8000/health"
    echo "  Adminer:   http://localhost:8080"
}

# Show logs
logs() {
    if [ -z "$2" ]; then
        docker compose logs -f
    else
        docker compose logs -f "$2"
    fi
}

# Clean everything (including volumes)
clean() {
    read -p "This will remove all containers, volumes, and data. Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cleaning all containers and volumes..."
        docker compose down -v
        print_success "Cleanup complete!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Rebuild and restart a specific service
rebuild() {
    if [ -z "$2" ]; then
        print_error "Please specify a service name (backend, frontend, agentai)"
        exit 1
    fi
    
    print_info "Rebuilding $2..."
    docker compose build --no-cache "$2"
    docker compose up -d "$2"
    print_success "$2 rebuilt and restarted!"
}

# Database backup
backup_db() {
    print_info "Backing up database..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    docker exec airbnb_mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-abcd@1234} air_bnb > "$backup_file"
    print_success "Database backed up to $backup_file"
}

# Show Kafka topics
kafka_topics() {
    print_info "Kafka Topics:"
    docker exec airbnb_kafka kafka-topics --bootstrap-server localhost:9093 --list
}

# Create Kafka topic
kafka_create_topic() {
    if [ -z "$2" ]; then
        print_error "Please specify a topic name"
        exit 1
    fi
    
    topic_name="$2"
    partitions="${3:-3}"
    
    print_info "Creating Kafka topic: $topic_name (partitions: $partitions)"
    docker exec airbnb_kafka kafka-topics \
        --bootstrap-server localhost:9093 \
        --create \
        --topic "$topic_name" \
        --partitions "$partitions" \
        --replication-factor 1
    print_success "Topic $topic_name created!"
}

# Monitor Kafka messages
kafka_consume() {
    if [ -z "$2" ]; then
        print_error "Please specify a topic name"
        exit 1
    fi
    
    print_info "Consuming messages from topic: $2"
    docker exec -it airbnb_kafka kafka-console-consumer \
        --bootstrap-server localhost:9093 \
        --topic "$2" \
        --from-beginning
}

# Health check all services
health() {
    print_info "Checking service health..."
    echo ""
    
    # Backend
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend is unhealthy or not responding"
    fi
    
    # AgentAI
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        print_success "AgentAI is healthy"
    else
        print_error "AgentAI is unhealthy or not responding"
    fi
    
    # Frontend
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend is unhealthy or not responding"
    fi
    
    # MySQL
    if docker exec airbnb_mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD:-abcd@1234} > /dev/null 2>&1; then
        print_success "MySQL is healthy"
    else
        print_error "MySQL is unhealthy or not responding"
    fi
}

# Show help
show_help() {
    cat << EOF
Airbnb Docker Management Script

Usage: ./docker-manage.sh [command] [options]

Commands:
    build               Build all Docker images
    start               Start all services
    stop                Stop all services
    restart             Restart all services
    status              Show service status
    logs [service]      Show logs (all or specific service)
    clean               Stop and remove all containers and volumes
    rebuild [service]   Rebuild and restart a specific service
    health              Check health of all services
    
Database Commands:
    backup-db           Backup MySQL database
    
Kafka Commands:
    kafka-topics        List all Kafka topics
    kafka-create [name] Create a new Kafka topic
    kafka-consume [topic] Consume messages from a topic

Examples:
    ./docker-manage.sh start
    ./docker-manage.sh logs backend
    ./docker-manage.sh rebuild frontend
    ./docker-manage.sh kafka-create booking-requests
    ./docker-manage.sh kafka-consume booking-requests

EOF
}

# Main script logic
case "$1" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$@"
        ;;
    clean)
        clean
        ;;
    rebuild)
        rebuild "$@"
        ;;
    backup-db)
        backup_db
        ;;
    kafka-topics)
        kafka_topics
        ;;
    kafka-create)
        kafka_create_topic "$@"
        ;;
    kafka-consume)
        kafka_consume "$@"
        ;;
    health)
        health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
