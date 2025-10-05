# 🌐 SCALABLE SSH MESH ARCHITECTURE

**True Peer-to-Peer Mesh - No Port Juggling**

---

## 🎯 Core Principle

**Every node can reach every other node via SSH.**  
**No custom ports. No webhooks. Just SSH tunnels.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  FULL MESH NETWORK                           │
│                                                              │
│     Vengeance ←──SSH──→ Aurora ←──SSH──→ RunPod            │
│         ↑                                        ↑           │
│         └────────────────SSH─────────────────────┘           │
│                                                              │
│  Every node has:                                            │
│  - SSH access to every other node                          │
│  - Standard Ollama on port 11434                           │
│  - No custom port forwarding                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Node Configuration

### **Each Node Has:**

1. **SSH Server** - Standard port 22 (or custom)
2. **Ollama** - Always on port 11434 (local)
3. **SSH Keys** - Passwordless access to all other nodes

### **No More:**

- ❌ Custom port forwarding (11435, 11436, etc.)
- ❌ Reverse tunnels that keep dying
- ❌ Port conflicts
- ❌ Complex systemd services

---

## 🔑 SSH Configuration

### **Setup Once Per Node:**

```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -f ~/.ssh/robbie_mesh -N ""

# Copy key to all other nodes
ssh-copy-id -i ~/.ssh/robbie_mesh user@other-node
```

### **SSH Config (`~/.ssh/config`):**

```
# Vengeance (local)
Host vengeance
    HostName 192.168.1.246
    User allan
    IdentityFile ~/.ssh/robbie_mesh
    ServerAliveInterval 60

# Aurora Town (cloud)
Host aurora
    HostName aurora-town-u44170.vm.elestio.app
    User root
    IdentityFile ~/.ssh/robbie_mesh
    ServerAliveInterval 60

# RunPod (cloud GPU)
Host runpod
    HostName 209.170.80.132
    Port 13323
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

---

## 🚀 Smart Orchestrator

### **How It Works:**

```python
class Node:
    def __init__(self, name, ssh_host):
        self.name = name
        self.ssh_host = ssh_host  # From ~/.ssh/config
        self.ollama_port = 11434  # Always the same!
    
    async def generate(self, prompt):
        # SSH to node and call its local Ollama
        cmd = f"ssh {self.ssh_host} 'curl -s http://localhost:11434/api/generate -d \"{json.dumps(request)}\"'"
        result = await run_command(cmd)
        return result

# That's it! No port mapping, no tunnels, just SSH!
```

### **Orchestrator Logic:**

```python
nodes = [
    Node("Vengeance", "vengeance"),  # SSH config handles details
    Node("RunPod", "runpod"),
    Node("Aurora", "aurora")
]

# Route to best node
best_node = select_by_load(nodes)
response = await best_node.generate(prompt)
```

---

## 💡 Benefits

### **Scalability:**

- ✅ Add new node? Just add SSH config entry
- ✅ Remove node? Delete SSH config entry
- ✅ No port conflicts ever
- ✅ Works with 3 nodes or 300 nodes

### **Simplicity:**

- ✅ One port per node (11434)
- ✅ Standard SSH (no custom tunnels)
- ✅ No systemd services to maintain
- ✅ No port forwarding rules

### **Reliability:**

- ✅ SSH handles reconnection
- ✅ No "tunnel died" issues
- ✅ Built-in keepalive
- ✅ Standard debugging tools

---

## 🔧 Implementation

### **1. Setup SSH Mesh (One-Time):**

```bash
#!/bin/bash
# setup-ssh-mesh.sh

# Generate mesh key
ssh-keygen -t ed25519 -f ~/.ssh/robbie_mesh -N ""

# Define all nodes
NODES=(
    "allan@192.168.1.246"                           # Vengeance
    "root@aurora-town-u44170.vm.elestio.app"       # Aurora
    "root@209.170.80.132 -p 13323"                 # RunPod
)

# Copy key to all nodes
for node in "${NODES[@]}"; do
    echo "Setting up: $node"
    ssh-copy-id -i ~/.ssh/robbie_mesh $node
done

# Create SSH config
cat >> ~/.ssh/config << 'EOF'
Host vengeance
    HostName 192.168.1.246
    User allan
    IdentityFile ~/.ssh/robbie_mesh

Host aurora
    HostName aurora-town-u44170.vm.elestio.app
    User root
    IdentityFile ~/.ssh/robbie_mesh

Host runpod
    HostName 209.170.80.132
    Port 13323
    User root
    IdentityFile ~/.ssh/id_ed25519
EOF

echo "✅ SSH Mesh configured!"
```

### **2. Smart Router (Python):**

```python
import asyncio
import subprocess
import json

class SSHNode:
    def __init__(self, name, ssh_alias):
        self.name = name
        self.ssh_alias = ssh_alias
        self.active_requests = 0
        self.avg_latency = 0
    
    async def call_ollama(self, prompt, model="qwen2.5:7b"):
        """Call Ollama on remote node via SSH"""
        self.active_requests += 1
        
        request = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        # SSH to node and curl its local Ollama
        cmd = [
            "ssh", self.ssh_alias,
            f"curl -s http://localhost:11434/api/generate -d '{json.dumps(request)}'"
        ]
        
        try:
            start = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            latency = time.time() - start
            
            self.avg_latency = (self.avg_latency + latency) / 2
            return json.loads(result.stdout)
        finally:
            self.active_requests -= 1
    
    def load_score(self):
        return self.active_requests * 100 + self.avg_latency * 10


class MeshOrchestrator:
    def __init__(self):
        self.nodes = [
            SSHNode("Vengeance RTX 4090", "vengeance"),
            SSHNode("RunPod RTX 4090", "runpod"),
            SSHNode("Aurora CPU", "aurora")
        ]
    
    def select_best_node(self):
        """Select node with lowest load"""
        return min(self.nodes, key=lambda n: n.load_score())
    
    async def generate(self, prompt):
        """Route to best available node"""
        node = self.select_best_node()
        print(f"🎯 Routing to: {node.name}")
        return await node.call_ollama(prompt)
```

### **3. Usage:**

```python
# That's it! No port configuration needed!
orchestrator = MeshOrchestrator()
response = await orchestrator.generate("Hello, world!")
```

---

## 🧪 Testing

```bash
# Test each node via SSH
ssh vengeance "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name'"
ssh aurora "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name'"
ssh runpod "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name'"

# All should return their model list
```

---

## 📊 Adding New Nodes

### **To add a new node:**

1. **Add SSH config entry:**

```bash
cat >> ~/.ssh/config << 'EOF'
Host newnode
    HostName new.node.com
    User root
    IdentityFile ~/.ssh/robbie_mesh
EOF
```

2. **Copy SSH key:**

```bash
ssh-copy-id -i ~/.ssh/robbie_mesh root@new.node.com
```

3. **Add to orchestrator:**

```python
self.nodes.append(SSHNode("New Node", "newnode"))
```

**Done!** No port forwarding, no tunnels, no systemd services.

---

## 🎯 Migration Plan

### **Current (Complex):**

```
Chat → Aurora:8007 → Aurora:11436 (Vengeance tunnel)
                   → Aurora:11435 (RunPod tunnel)
                   → Aurora:11434 (local)
```

### **New (Simple):**

```
Chat → Orchestrator → ssh vengeance "curl localhost:11434"
                   → ssh runpod "curl localhost:11434"
                   → ssh aurora "curl localhost:11434"
```

### **Steps:**

1. ✅ Setup SSH mesh (keys + config)
2. ✅ Update orchestrator to use SSH calls
3. ✅ Remove all custom port forwards
4. ✅ Remove tunnel systemd services
5. ✅ Test and deploy

---

## 💪 Why This Is Better

| Old Way | New Way |
|---------|---------|
| Port 11434, 11435, 11436... | Port 11434 everywhere |
| Reverse tunnels that die | SSH handles reconnection |
| systemd services per tunnel | No services needed |
| Port conflicts | No conflicts possible |
| Hard to add nodes | Add SSH config entry |
| Complex debugging | Standard SSH tools |

---

## ✅ Production Ready

**This architecture:**

- Scales to unlimited nodes
- No port management
- Self-healing (SSH reconnects)
- Standard tools (SSH, curl)
- Easy to debug
- Easy to add/remove nodes

**Let's build it!** 🚀
