#!/usr/bin/env python3
import yaml
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
YAML_PATH = PROJECT_ROOT / 'deployment/aurora-standard-node/config/node-inventory.yml'
DOC_PATH = PROJECT_ROOT / 'deployment/aurora-standard-node/FINAL_ARCHITECTURE.md'

BEGIN = '<!-- BEGIN:NODE_IP_INVENTORY -->'
END = '<!-- END:NODE_IP_INVENTORY -->'

def load_inventory():
    with open(YAML_PATH, 'r') as f:
        return yaml.safe_load(f)

def render_table(inv: dict) -> str:
    rows = ["| Node | Role | VPN IP | Public |", "|------|------|--------|--------|"]
    for n in inv.get('nodes', []):
        public = n.get('public_dns') or n.get('public_ip') or '—'
        rows.append(f"| {n.get('name')} | {n.get('role')} | {n.get('vpn_ip')} | {public} |")

    extras = [
        "",
        "Reference inventory (source of truth): `deployment/aurora-standard-node/config/node-inventory.yml`",
        "",
        "Quick checks:",
        "- Resolve Aurora public IP: `dig +short aurora-town-u44170.vm.elestio.app`",
        "- Show node public IP (on node): `curl -s ifconfig.me`",
        "- Show VPN IP (on node): `ip -4 addr show wg0 | awk '/inet /{print $2}'`",
        "- List WireGuard peers: `wg show`",
    ]
    return "\n".join(rows + extras)

def update_doc(table_md: str):
    content = DOC_PATH.read_text()
    pattern = re.compile(rf"{re.escape(BEGIN)}[\s\S]*?{re.escape(END)}", re.MULTILINE)
    block = f"{BEGIN}\n{table_md}\n{END}"
    if pattern.search(content):
        content = pattern.sub(block, content)
    else:
        content += f"\n\n{block}\n"
    DOC_PATH.write_text(content)

def main():
    inv = load_inventory()
    table_md = render_table(inv)
    update_doc(table_md)
    print("Updated FINAL_ARCHITECTURE.md from node-inventory.yml")

if __name__ == '__main__':
    main()


