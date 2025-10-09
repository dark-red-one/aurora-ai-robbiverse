#!/usr/bin/env python3
import subprocess
import yaml
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
YAML_PATH = PROJECT_ROOT / 'deployment/aurora-standard-node/config/node-inventory.yml'

def load_inventory():
    with open(YAML_PATH, 'r') as f:
        return yaml.safe_load(f)

def ping(host: str) -> bool:
    try:
        subprocess.check_output(['ping', '-c', '1', '-W', '1', host])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    inv = load_inventory()
    nodes = inv.get('nodes', [])

    print("Node inventory check:")
    for n in nodes:
        name = n.get('name')
        vpn_ip = n.get('vpn_ip')
        public = n.get('public_dns') or n.get('public_ip')

        vpn_ok = ping(vpn_ip) if vpn_ip and vpn_ip != 'dynamic' else False
        public_ok = ping(public) if public and public not in ('dynamic', '<runpod-public-ip>', '<set-your-backup-hostname>') else False

        print(f"- {name}: VPN {vpn_ip} [{'OK' if vpn_ok else 'NO'}], Public {public} [{'OK' if public_ok else 'NO'}]")

if __name__ == '__main__':
    main()


