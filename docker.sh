#!/bin/bash

# Script untuk mengelola WhatsApp API dengan Docker

case "$1" in
    build)
        echo "🔨 Building Docker image..."
        docker-compose build --no-cache
        ;;
        
    up)
        echo "🚀 Starting WhatsApp API with Docker Compose..."
        docker-compose up -d --build
        
        echo "⏳ Waiting for container to be ready..."
        sleep 10
        
        # Check if container is running
        if docker-compose ps | grep "whatsapp_api_server" | grep "Up" > /dev/null; then
            echo "✅ Container is running!"
            echo "🌐 API available at: http://localhost:3000"
            echo "📱 QR Code at: http://localhost:3000/api/qr?apiKey=whatsapp_api_secret_key_2024"
            echo ""
            echo "📋 Useful commands:"
            echo "  ./docker.sh logs    - View logs"
            echo "  ./docker.sh status  - Check status"
            echo "  ./docker.sh stop    - Stop container"
        else
            echo "❌ Container failed to start. Check logs:"
            docker-compose logs
        fi
        ;;
        
    down)
        echo "🛑 Stopping WhatsApp API containers..."
        docker-compose down
        ;;
        
    stop)
        echo "⏸️ Stopping WhatsApp API containers..."
        docker-compose stop
        ;;
        
    restart)
        echo "🔄 Restarting WhatsApp API..."
        docker-compose restart
        ;;
        
    logs)
        echo "📋 Viewing logs (Ctrl+C to exit)..."
        docker-compose logs -f whatsapp-api
        ;;
        
    status)
        echo "📊 Docker Container Status:"
        docker-compose ps
        echo ""
        echo "🔍 Health Check:"
        
        # Test API health
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo "✅ API Health: OK"
            
            # Test WhatsApp status
            STATUS=$(curl -s -H "X-API-Key: whatsapp_api_secret_key_2024" http://localhost:3000/api/status 2>/dev/null)
            if echo "$STATUS" | grep -q "isConnected.*true"; then
                echo "📱 WhatsApp: Connected"
            elif echo "$STATUS" | grep -q "qr"; then
                echo "📱 WhatsApp: Waiting for QR scan"
            else
                echo "📱 WhatsApp: Disconnected"
            fi
        else
            echo "❌ API Health: Error"
        fi
        ;;
        
    shell)
        echo "🐚 Opening shell in container..."
        docker-compose exec whatsapp-api sh
        ;;
        
    clean)
        echo "🧹 Cleaning up Docker resources..."
        docker-compose down -v
        docker system prune -f
        ;;
        
    reset)
        echo "🔄 Resetting everything (will lose WhatsApp session)..."
        read -p "Are you sure? This will delete WhatsApp session data (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            rm -rf sessions/* uploads/* logs/*
            docker-compose up -d --build
        else
            echo "❌ Reset cancelled"
        fi
        ;;
        
    *)
        echo "🐳 WhatsApp API Docker Manager"
        echo ""
        echo "Usage: $0 {build|up|down|stop|restart|logs|status|shell|clean|reset}"
        echo ""
        echo "Commands:"
        echo "  build    - Build Docker image"
        echo "  up       - Start containers (with build)"
        echo "  down     - Stop and remove containers"
        echo "  stop     - Stop containers"
        echo "  restart  - Restart containers"
        echo "  logs     - View container logs"
        echo "  status   - Check container and API status"
        echo "  shell    - Open shell in container"
        echo "  clean    - Clean up Docker resources"
        echo "  reset    - Reset everything (deletes session data)"
        echo ""
        echo "Examples:"
        echo "  $0 up       # Start WhatsApp API"
        echo "  $0 logs     # View logs"
        echo "  $0 status   # Check status"
        echo "  $0 down     # Stop everything"
        exit 1
        ;;
esac
