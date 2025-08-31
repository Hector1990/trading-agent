#!/bin/bash

# Docker deployment script for TradingAgents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
BUILD_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            ENVIRONMENT="prod"
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: ./docker-deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --prod, --production  Deploy with production configuration (includes nginx)"
            echo "  --build-only         Only build images, don't start containers"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🚀 TradingAgents Docker Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file with your API keys before running the application.${NC}"
    exit 1
fi

# Build and deploy based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${GREEN}Building production environment...${NC}"
    
    if [ "$BUILD_ONLY" = true ]; then
        docker-compose -f docker-compose.yml build
        echo -e "${GREEN}✅ Build complete!${NC}"
    else
        docker-compose -f docker-compose.yml up --build -d
        echo -e "${GREEN}✅ Production deployment complete!${NC}"
        echo -e "${YELLOW}Services:${NC}"
        echo "  - Frontend: http://localhost (via nginx)"
        echo "  - Backend API: http://localhost/api"
        echo "  - Direct Frontend: http://localhost:3000"
        echo "  - Direct Backend: http://localhost:8000"
    fi
else
    echo -e "${GREEN}Building development environment...${NC}"
    
    if [ "$BUILD_ONLY" = true ]; then
        docker-compose -f docker-compose.dev.yml build
        echo -e "${GREEN}✅ Build complete!${NC}"
    else
        docker-compose -f docker-compose.dev.yml up --build -d
        echo -e "${GREEN}✅ Development deployment complete!${NC}"
        echo -e "${YELLOW}Services:${NC}"
        echo "  - Frontend: http://localhost:3000"
        echo "  - Backend API: http://localhost:8000"
    fi
fi

# Show container status
if [ "$BUILD_ONLY" = false ]; then
    echo -e "\n${YELLOW}Container Status:${NC}"
    docker-compose -f docker-compose.$( [ "$ENVIRONMENT" = "prod" ] && echo "yml" || echo "dev.yml" ) ps
    
    echo -e "\n${GREEN}To view logs:${NC}"
    echo "  docker-compose -f docker-compose.$( [ "$ENVIRONMENT" = "prod" ] && echo "yml" || echo "dev.yml" ) logs -f"
    
    echo -e "\n${GREEN}To stop the services:${NC}"
    echo "  docker-compose -f docker-compose.$( [ "$ENVIRONMENT" = "prod" ] && echo "yml" || echo "dev.yml" ) down"
fi
