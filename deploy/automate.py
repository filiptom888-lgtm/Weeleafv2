#!/usr/bin/env python3
"""One-shot Hostinger deploy. Password via env WL_DEPLOY_PASS only."""
import json
import os
import subprocess
import sys
from pathlib import Path

import paramiko
from scp import SCPClient

HOST = "92.113.18.31"
PORT = 65002
USER = "u769128625"
WEB_ROOT = "domains/weeleaf.com/public_html"
INSTALL_KEY = "weeleaf-setup-2026"
PROJECT = Path(__file__).resolve().parents[1]


def run_local(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    if sys.platform == "win32" and cmd[0] == "npm":
        subprocess.run(cmd, cwd=PROJECT, check=True, shell=True)
    else:
        subprocess.run(cmd, cwd=PROJECT, check=True)


def main() -> int:
    password = os.environ.get("WL_DEPLOY_PASS")
    if not password:
        print("Set WL_DEPLOY_PASS environment variable", file=sys.stderr)
        return 1

    print("==> Building frontend")
    run_local(["npm", "run", "build"])

    print("==> Connecting SSH")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=password, timeout=30)

    pub_key_path = Path.home() / ".ssh" / "id_ed25519.pub"
    if pub_key_path.exists():
        pub = pub_key_path.read_text().strip()
        client.exec_command(
            f"mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
            f"grep -qF '{pub}' ~/.ssh/authorized_keys 2>/dev/null || "
            f"echo '{pub}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
        )

    remote_base = f"/home/{USER}/{WEB_ROOT}"
    print("==> Uploading frontend")
    with SCPClient(client.get_transport()) as scp:
        scp.put(str(PROJECT / "dist" / "index.html"), f"{remote_base}/index.html")
        scp.put(str(PROJECT / "dist" / "assets"), remote_base, recursive=True)

        print("==> Uploading API")
        scp.put(str(PROJECT / "api"), remote_base, recursive=True)

    _, _, _ = client.exec_command(
        f"chmod 755 {remote_base}/assets && chmod 644 {remote_base}/assets/*"
    )

    db_pass = (os.environ.get("WL_DB_PASS") or os.environ.get("WL_DEPLOY_PASS") or "").replace("'", "\\'")
    php_config = f"""<?php
return [
    'db_host' => 'localhost',
    'db_name' => 'u769128625_weeleaf',
    'db_user' => 'u769128625_weeleaf_app',
    'db_pass' => '{db_pass}',
    'admin_password' => '1234',
    'install_key' => '{INSTALL_KEY}',
    'cors_origin' => '*',
];
"""

    sftp = client.open_sftp()
    with sftp.file(f"{remote_base}/api/config.local.php", "w") as f:
        f.write(php_config)
    sftp.close()

    print("==> Health check")
    _, stdout, stderr = client.exec_command(f"curl -s https://weeleaf.com/api/health")
    health = stdout.read().decode()
    print(health or stderr.read().decode())

    print("==> Running install")
    payload = json.dumps({"install_key": INSTALL_KEY})
    _, stdout, _ = client.exec_command(
        f"curl -s -X POST https://weeleaf.com/api/install.php "
        f"-H 'Content-Type: application/json' -d '{payload}'"
    )
    print(stdout.read().decode())

    client.close()
    print("==> Deploy complete: https://weeleaf.com")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
