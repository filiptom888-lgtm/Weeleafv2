#!/usr/bin/env python3
import os
import paramiko

HOST, PORT, USER = "92.113.18.31", 65002, "u769128625"
WEB_ROOT = "domains/weeleaf.com/public_html"
password = os.environ.get("WL_DEPLOY_PASS")
if not password:
    raise SystemExit("WL_DEPLOY_PASS required")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=password, timeout=30)
base = f"/home/{USER}/{WEB_ROOT}"

for label, cmd in [
    ("migrate", f"cd {base}/api && php migrate-coin-images-cli.php 2>&1"),
    ("migrate_via_curl", "curl -s https://weeleaf.com/api/config -o /tmp/cfg.json -w 'size:%{size_download}\\n' && head -c 500 /tmp/cfg.json"),
    ("files", f"ls -la {base}/uploads/coins/ 2>&1 | head -20"),
    ("config_size", "curl -s -o /dev/null -w '%{size_download}' https://weeleaf.com/api/config"),
]:
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(f"=== {label} ===")
    print(out or err)

client.close()
