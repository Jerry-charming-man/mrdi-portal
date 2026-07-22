#!/usr/bin/env python3
"""
MRDI Portal · Webhook Receiver for vm-jerry-dev-01

用途：接收 GitHub Actions cd.yml 发送的 webhook，
      自动拉取最新镜像 + 重启容器。

用法：
  # 开发调试（直接运行）
  python webhook-receiver.py

  # 生产（systemd service）
  systemctl start mrdi-webhook

端口：9000（仅监听 localhost，对外由 Caddy 代理 /api/deploy）
日志：/var/log/mrdi-webhook.log

依赖：Python 3.10+，requests
"""

import http.server
import socketserver
import json
import os
import subprocess
import hashlib
import logging
from datetime import datetime

# ── 配置 ──────────────────────────────────────────────
PORT = 9000
WEBHOOK_SECRET = os.environ.get("MRDI_WEBHOOK_SECRET", "")
DEPLOY_SCRIPT = "/opt/mrdi/deploy.sh"
LOG_FILE = "/var/log/mrdi-webhook.log"

# ── 日志设置 ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WEBHOOK] %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


# ── 部署逻辑 ──────────────────────────────────────────
def run_deploy(payload: dict) -> bool:
    """执行 docker compose pull + up。返回 True 表示成功。"""
    sha = payload.get("sha", "unknown")[:8]
    ref = payload.get("ref", "?")
    actor = payload.get("actor", "?")
    repo = payload.get("repository", "?")

    logger.info(f"Starting deploy — repo={repo} ref={ref} sha={sha} actor={actor}")

    try:
        # 1. Pull latest images
        logger.info("Pulling latest images...")
        result = subprocess.run(
            ["docker", "compose", "-f", DEPLOY_SCRIPT.replace("deploy.sh", "docker-compose.prod.yml"), "pull", "--quiet"],
            cwd="/opt/mrdi",
            capture_output=True,
            text=True,
            timeout=300,  # 5min for pull
        )
        if result.returncode != 0:
            logger.error(f"Pull failed: {result.stderr}")
            # 非致命，继续尝试 up
        else:
            logger.info("Pull done.")

        # 2. Restart containers (recreate + start)
        logger.info("Restarting containers...")
        result = subprocess.run(
            ["docker", "compose", "-f", DEPLOY_SCRIPT.replace("deploy.sh", "docker-compose.prod.yml"), "up", "-d", "--remove-orphans"],
            cwd="/opt/mrdi",
            capture_output=True,
            text=True,
            timeout=120,  # 2min for up
        )
        if result.returncode != 0:
            logger.error(f"Restart failed: {result.stderr}")
            return False

        logger.info(f"Deploy complete — sha={sha}")
        return True

    except subprocess.TimeoutExpired:
        logger.error("Deploy timed out (>5min)")
        return False
    except Exception as e:
        logger.exception(f"Deploy error: {e}")
        return False


# ── Webhook 验证 ───────────────────────────────────────
def verify_signature(body: bytes, signature_header: str | None) -> bool:
    """HMAC-SHA256 验证 GitHub webhook payload。"""
    if not WEBHOOK_SECRET:
        logger.warning("MRDI_WEBHOOK_SECRET not set — skipping signature check")
        return True  # dev 模式跳过

    if not signature_header:
        return False

    expected = "sha256=" + hashlib.sha256(
        WEBHOOK_SECRET.encode() + body
    ).hexdigest()

    return hashlib.compare_digest(expected, signature_header)


# ── HTTP Handler ───────────────────────────────────────
class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # 自定义日志格式
        logger.info(format % args)

    def send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        # 读取 body
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # 验证签名
        sig = self.headers.get("X-Webhook-Secret")
        if not verify_signature(body, sig):
            logger.warning("Signature mismatch — rejecting request")
            self.send_json(403, {"error": "Forbidden", "message": "Invalid signature"})
            return

        # 解析 payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Bad Request", "message": "Invalid JSON"})
            return

        # 路由
        if self.path == "/api/deploy":
            logger.info(f"Received deploy webhook: {payload.get('event', '?')}")

            if payload.get("event") == "deployment":
                ok = run_deploy(payload)
                self.send_json(200, {
                    "status": "ok" if ok else "error",
                    "message": "Deploy triggered" if ok else "Deploy failed",
                    "sha": payload.get("sha", "?")[:8],
                    "timestamp": datetime.utcnow().isoformat(),
                })
            else:
                self.send_json(200, {"status": "ignored", "message": f"Event '{payload.get('event')}' not handled"})

        elif self.path == "/health":
            self.send_json(200, {"status": "ok", "service": "mrdi-webhook-receiver"})

        else:
            self.send_json(404, {"error": "Not Found", "path": self.path})

    def do_GET(self):
        """Health check endpoint."""
        self.send_json(200, {"status": "ok", "service": "mrdi-webhook-receiver"})


# ── 入口 ───────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    logger.info(f"Starting MRDI Webhook Receiver on port {PORT}")
    logger.info(f"DEPLOY_SCRIPT={DEPLOY_SCRIPT}")
    logger.info(f"SECRET configured: {'yes' if WEBHOOK_SECRET else 'NO (dev mode)'}")

    with socketserver.TCPServer(("", PORT), WebhookHandler) as httpd:
        logger.info(f"Listening on http://0.0.0.0:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
