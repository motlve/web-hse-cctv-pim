#!/bin/bash

PROJECT_NAME="web-hse-cctv-pim"

echo "===================================="
echo " Docker Manager - $PROJECT_NAME"
echo "===================================="

case "$1" in


start)

    echo "🚀 Starting containers..."
    docker compose up -d

    echo ""
    echo "✅ Container status:"
    docker ps

;;


stop)

    echo "🛑 Stopping containers..."
    docker compose down

;;


restart)

    echo "🔄 Restart all containers..."

    docker compose down

    docker compose up -d

    echo ""
    docker ps

;;


build)

    echo "🔨 Build all images..."

    docker compose build --no-cache

    echo "✅ Build selesai"

;;


rebuild)

    echo "♻️ Full rebuild..."

    docker compose down

    docker compose build --no-cache

    docker compose up -d

    echo ""

    docker ps

;;


nginx)

    echo "🔄 Restart nginx..."

    docker compose restart nginx

    echo ""

    docker logs nginx-main --tail 50

;;


status)

    echo "📦 Docker status"

    docker ps

;;


logs)

    if [ -z "$2" ]
    then
        echo ""
        echo "Contoh:"
        echo "./docker-manage.sh logs backend-cctv"
        echo ""
        exit 1
    fi

    docker logs "$2" --tail 100 -f

;;


mysql)

    echo "🗄️ Masuk MySQL..."

    docker exec -it mysql-main mysql -uroot -p

;;


health)

    echo "🔎 Docker health check"

    echo ""

    docker ps --format "
table {{.Names}}\t{{.Status}}\t{{.Ports}}"

;;


test)

    echo ""
    echo "=== MAIN WEBSITE ==="

    curl -I http://localhost


    echo ""
    echo "=== COMPANY PROFILE ==="

    curl -I http://localhost/


    echo ""
    echo "=== CCTV API ==="

    curl http://localhost/api/id-cctv


    echo ""
    echo "=== CCTV FRONTEND ==="

    curl -I http://localhost/cctv/login/


;;


clean)

    echo "⚠️ Cleaning unused docker..."

    docker system prune -f

;;


*)

echo "

Cara pakai:

./docker-manage.sh start

./docker-manage.sh stop

./docker-manage.sh restart

./docker-manage.sh build

./docker-manage.sh rebuild

./docker-manage.sh nginx

./docker-manage.sh status

./docker-manage.sh health

./docker-manage.sh logs backend-cctv

./docker-manage.sh mysql

./docker-manage.sh test

./docker-manage.sh clean

"

;;

esac