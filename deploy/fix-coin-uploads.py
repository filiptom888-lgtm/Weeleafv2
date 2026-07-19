#!/usr/bin/env python3
"""Check server coin upload paths and re-run migration."""
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

cmds = [
    f"ls -la {base}/uploads/coins/ 2>&1 | head -20",
    f"ls -la {base}/api/uploads/coins/ 2>&1 | head -10",
    f"find {base} -name 'wl-core.webp' 2>/dev/null",
    f"cd {base}/api && php migrate-coin-images-cli.php 2>&1",
    f"test -f {base}/wl-config.json && wc -c {base}/wl-config.json || echo 'no wl-config'",
]
for cmd in cmds:
    print("===", cmd[:70], "===")
    _, out, err = client.exec_command(cmd)
    print((out.read() + err.read()).decode("utf-8", errors="replace"))

client.close()
