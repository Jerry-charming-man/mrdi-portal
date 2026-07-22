#!/bin/bash
# MRDI Portal · vm-jerry-dev-01 部署脚本
# 由 webhook-receiver.py 调用，或手动运行

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-mavis}"
DEPLOY_DIR="/opt/mrdi"
LOG_FILE="/var/log/mrdi-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== MRDI Deploy started ==="

# Pull latest images
log "Pulling latest images..."
docker compose -f "$DEPLOY_DIR/docker-compose.prod.yml" pull --quiet

# Restart containers
log "Restarting containers..."
docker compose -f "$DEPLOY_DIR/docker-compose.prod.yml" up -d --remove-orphans

# Health check
sleep 10
for service in mdm-api cimrms-api cimims-api cim-perm-api; do
  status=$(docker compose -f "$DEPLOY_DIR/docker-compose.prod.yml" ps "$service" --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',d.get('State','unknown')))" 2>/dev/null || echo "unknown")
  log "$service: $status"
done

log "=== MRDI Deploy complete ==="
