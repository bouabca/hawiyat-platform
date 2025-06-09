#!/bin/bash
install_hawiyat() {
    if [ "$(id -u)" != "0" ]; then
        echo "This script must be run as root" >&2
        exit 1
    fi

    # check if is Mac OS
    if [ "$(uname)" = "Darwin" ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if is running inside a container
    if [ -f /.dockerenv ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if something is running on port 80
    if ss -tulnp | grep ':80 ' >/dev/null; then
        echo "Error: something is already running on port 80" >&2
        exit 1
    fi

    # check if something is running on port 443
    if ss -tulnp | grep ':443 ' >/dev/null; then
        echo "Error: something is already running on port 443" >&2
        exit 1
    fi

    command_exists() {
      command -v "$@" > /dev/null 2>&1
    }

    if command_exists docker; then
      echo "Docker already installed"
    else
      curl -sSL https://get.docker.com | sh
    fi

    docker swarm leave --force 2>/dev/null

    get_ip() {
        local ip=""

        # Try IPv4 first
        # First attempt: ifconfig.io
        ip=$(curl -4s --connect-timeout 5 https://ifconfig.io 2>/dev/null)

        # Second attempt: icanhazip.com
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
        fi

        # Third attempt: ipecho.net
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
        fi

        # If no IPv4, try IPv6
        if [ -z "$ip" ]; then
            # Try IPv6 with ifconfig.io
            ip=$(curl -6s --connect-timeout 5 https://ifconfig.io 2>/dev/null)

            # Try IPv6 with icanhazip.com
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
            fi

            # Try IPv6 with ipecho.net
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
            fi
        fi

        if [ -z "$ip" ]; then
            echo "Error: Could not determine server IP address automatically (neither IPv4 nor IPv6)." >&2
            echo "Please set the ADVERTISE_ADDR environment variable manually." >&2
            echo "Example: export ADVERTISE_ADDR=<your-server-ip>" >&2
            exit 1
        fi

        echo "$ip"
    }

    advertise_addr="127.0.0.1"
    echo "Using advertise address: $advertise_addr"

    docker swarm init --advertise-addr $advertise_addr

     if [ $? -ne 0 ]; then
        echo "Error: Failed to initialize Docker Swarm" >&2
        exit 1
    fi

    echo "Swarm initialized"

    docker network rm -f dokploy-network 2>/dev/null
    docker network create --driver overlay --attachable dokploy-network

    echo "Network created"

    mkdir -p /etc/dokploy

    chmod 777 /etc/dokploy

    docker service create \
    --name dokploy-postgres \
    --constraint 'node.role==manager' \
    --network dokploy-network \
    --env POSTGRES_USER=dokploy \
    --env POSTGRES_DB=dokploy \
    --env POSTGRES_PASSWORD=amukds4wi9001583845717ad2 \
    --mount type=volume,source=dokploy-postgres-database,target=/var/lib/postgresql/data \
    postgres:16

    docker service create \
    --name dokploy-redis \
    --constraint 'node.role==manager' \
    --network dokploy-network \
    --mount type=volume,source=redis-data-volume,target=/data \
    redis:7

    # Installation
    docker service create \
      --name dokploy \
      --replicas 1 \
      --network dokploy-network \
      --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
      --mount type=bind,source=/etc/dokploy,target=/etc/dokploy \
      --mount type=volume,source=dokploy-docker-config,target=/root/.docker \
      --publish published=3000,target=3000,mode=host \
      --update-parallelism 1 \
      --update-order stop-first \
      --constraint 'node.role == manager' \
      -e ADVERTISE_ADDR=$advertise_addr \
      chamso2004/dokploy:latest

    sleep 4

    docker run -d \
        --name dokploy-traefik \
        --network dokploy-network \
        --restart always \
        -v /etc/dokploy/traefik/traefik.yml:/etc/traefik/traefik.yml \
        -v /etc/dokploy/traefik/dynamic:/etc/dokploy/traefik/dynamic \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -p 80:80/tcp \
        -p 443:443/tcp \
        -p 443:443/udp \
        traefik:v3.1.2


    # Optional: Use docker service create instead of docker run
    #   docker service create \
    #     --name dokploy-traefik \
    #     --constraint 'node.role==manager' \
    #     --network dokploy-network \
    #     --mount type=bind,source=/etc/dokploy/traefik/traefik.yml,target=/etc/traefik/traefik.yml \
    #     --mount type=bind,source=/etc/dokploy/traefik/dynamic,target=/etc/dokploy/traefik/dynamic \
    #     --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    #     --publish mode=host,published=443,target=443 \
    #     --publish mode=host,published=80,target=80 \
    #     --publish mode=host,published=443,target=443,protocol=udp \
    #     traefik:v3.1.2

    GREEN="\033[0;32m"
    YELLOW="\033[1;33m"
    BLUE="\033[0;34m"
    NC="\033[0m" # No Color

    format_ip_for_url() {
        local ip="$1"
        if echo "$ip" | grep -q ':'; then
            # IPv6
            echo "[${ip}]"
        else
            # IPv4
            echo "${ip}"
        fi
    }

    formatted_addr=$(format_ip_for_url "$advertise_addr")
    echo ""
    printf "${GREEN}Congratulations, Dokploy is installed!${NC}\n"
    printf "${BLUE}Wait 15 seconds for the server to start${NC}\n"
    printf "${YELLOW}Please go to http://${formatted_addr}:3000${NC}\n\n"
}

update_hawiyat() {
    echo "Updating Dokploy..."

    # Pull the latest image
    docker pull chamso2004/dokploy:latest

    # Update the service
    docker service update --image chamso2004/dokploy:latest dokploy

    echo "Dokploy has been updated to the latest version."
}

create_user() {

export ADMIN_NAME='Hawiyat-admin'
export ADMIN_EMAIL='admin@hawiyat.com'
export ADMIN_PASSWORD='hawiyat@super_3000'    





# Check if required environment variables are set
    if [ -z "${ADMIN_NAME}" ] || [ -z "${ADMIN_EMAIL}" ] || [ -z "${ADMIN_PASSWORD}" ]; then
        echo "❌ Error: Please set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables"
        echo "Example:"
        echo "export ADMIN_NAME='Hawiyat-admin'"
        echo "export ADMIN_EMAIL='admin@hawiyat.com'"
        echo "export ADMIN_PASSWORD='hawiyat@super_3000'"
        return 1
    fi

    server_ip="${ADVERTISE_ADDR:-localhost}"
    formatted_ip=$(format_ip_for_url "$server_ip")
    api_url="http://${formatted_ip}:3000/api/auth/sign-up/email"

    # Make the API request and capture both status code and response
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"${ADMIN_NAME}\",\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
        "$api_url")
    
    # Extract status code and body from response
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "201" ]; then
        echo "✅ User '${ADMIN_NAME}' created successfully!"
        # Send installation webhook
        
    else
        
        echo "Response: $response_body"
        return 1
    fi
    curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "{\"ip\":\"${server_ip}\",\"machine_id\":\"$(cat /etc/machine-id 2>/dev/null || hostname)\",\"os\":\"$(cat /etc/os-release 2>/dev/null | grep "PRETTY_NAME" | cut -d'"' -f2)\",\"install_date\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
            "https://hawiyat.vercel.app/api/webhooks/headless/anyjson" || echo "⚠️ Warning: Failed to send installation data"
    
    
}

# Main script execution
if [ "$1" = "update" ]; then
    update_hawiyat
else
    install_hawiyat
    create_user
fi