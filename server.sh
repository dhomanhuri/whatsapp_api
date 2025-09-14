#!/bin/bash

# Script untuk mengelola WhatsApp API Server

case "$1" in
    start)
        echo "🚀 Memulai WhatsApp API Server..."
        
        # Cek apakah server sudah berjalan
        if pgrep -f "node index.js" > /dev/null; then
            echo "⚠️ Server sudah berjalan!"
            exit 1
        fi
        
        # Jalankan server di background
        nohup node index.js > server.log 2>&1 &
        
        # Tunggu sebentar dan cek status
        sleep 3
        if pgrep -f "node index.js" > /dev/null; then
            echo "✅ Server berhasil dijalankan"
            echo "🌐 Akses: http://localhost:3000"
            echo "📱 QR Code: http://localhost:3000/api/qr?apiKey=whatsapp_api_secret_key_2024"
        else
            echo "❌ Gagal menjalankan server. Cek server.log untuk detail error."
        fi
        ;;
        
    stop)
        echo "🛑 Menghentikan WhatsApp API Server..."
        
        if pgrep -f "node index.js" > /dev/null; then
            pkill -f "node index.js"
            sleep 2
            
            if ! pgrep -f "node index.js" > /dev/null; then
                echo "✅ Server berhasil dihentikan"
            else
                echo "⚠️ Force kill server..."
                pkill -9 -f "node index.js"
                echo "✅ Server dihentikan paksa"
            fi
        else
            echo "ℹ️ Server tidak sedang berjalan"
        fi
        ;;
        
    restart)
        echo "🔄 Restart WhatsApp API Server..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        echo "📊 Status WhatsApp API Server:"
        
        if pgrep -f "node index.js" > /dev/null; then
            PID=$(pgrep -f "node index.js")
            echo "✅ Server berjalan (PID: $PID)"
            
            # Test koneksi
            if curl -s http://localhost:3000/health > /dev/null; then
                echo "🌐 HTTP Server: OK"
            else
                echo "❌ HTTP Server: Error"
            fi
        else
            echo "❌ Server tidak berjalan"
        fi
        ;;
        
    logs)
        echo "📋 Log Server (Ctrl+C untuk keluar):"
        tail -f server.log
        ;;
        
    *)
        echo "🤖 WhatsApp API Server Manager"
        echo ""
        echo "Penggunaan: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Perintah:"
        echo "  start   - Jalankan server"
        echo "  stop    - Hentikan server"
        echo "  restart - Restart server"
        echo "  status  - Cek status server"
        echo "  logs    - Lihat log server"
        echo ""
        echo "Contoh:"
        echo "  $0 start     # Jalankan server"
        echo "  $0 stop      # Hentikan server"
        echo "  $0 status    # Cek status"
        exit 1
        ;;
esac
