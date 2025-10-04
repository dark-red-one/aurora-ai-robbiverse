# Vengeance Linux Setup Guide
## RTX 4090 Desktop Migration from Windows to Linux

### Pre-Installation Checklist

#### 1. Backup Critical Data
```bash
# Create backup directories
mkdir C:\VengeanceBackup
mkdir C:\VengeanceBackup\Documents
mkdir C:\VengeanceBackup\Projects
mkdir C:\VengeanceBackup\Configs
mkdir C:\VengeanceBackup\Drivers
```

#### 2. Download Essential Tools
- **Rufus** (USB bootable creator): https://rufus.ie/
- **Balena Etcher** (Alternative USB creator): https://www.balena.io/etcher/
- **GParted Live** (Disk partitioning): https://gparted.org/livecd.php

#### 3. Recommended Linux Distribution
**Pop!_OS 22.04 LTS** (Best for NVIDIA RTX 4090)
- Pre-installed NVIDIA drivers
- Excellent gaming and AI/ML support
- Based on Ubuntu 22.04 LTS
- Download: https://pop.system76.com/

**Alternative: Ubuntu 22.04 LTS with NVIDIA drivers**
- More widely supported
- Better for development
- Download: https://ubuntu.com/download/desktop

#### 4. Hardware Requirements Check
- ✅ RTX 4090 (24GB VRAM) - Perfect for AI/ML
- ✅ Ensure UEFI boot support
- ✅ Secure Boot can be disabled
- ✅ At least 16GB RAM recommended
- ✅ SSD for OS installation

### Installation Steps

#### Step 1: Prepare Windows Machine
1. **Disable Fast Startup**
   - Control Panel → Power Options → Choose what power buttons do
   - Uncheck "Turn on fast startup"

2. **Disable Secure Boot** (if needed)
   - Restart and enter BIOS/UEFI
   - Find Secure Boot settings and disable

3. **Create Windows Recovery USB** (Optional but recommended)
   - Windows Recovery Drive tool
   - Keep for emergency Windows access

#### Step 2: Create Linux Bootable USB
1. Download Pop!_OS ISO (5.1GB)
2. Use Rufus with these settings:
   - Partition scheme: GPT
   - Target system: UEFI (non CSM)
   - File system: FAT32
   - Boot selection: Pop!_OS ISO

#### Step 3: Backup Current System
```powershell
# Run as Administrator in PowerShell
# Backup important directories
robocopy "C:\Users\%USERNAME%\Documents" "C:\VengeanceBackup\Documents" /E /R:3 /W:10
robocopy "C:\Users\%USERNAME%\Desktop" "C:\VengeanceBackup\Desktop" /E /R:3 /W:10
robocopy "C:\Users\%USERNAME%\Downloads" "C:\VengeanceBackup\Downloads" /E /R:3 /W:10

# Backup installed programs list
wmic product get name,version > "C:\VengeanceBackup\installed_programs.txt"

# Backup network settings
netsh wlan export profile folder="C:\VengeanceBackup\Configs" key=clear
```

#### Step 4: Disk Partitioning Strategy
**Recommended Layout:**
- **EFI System Partition**: 512MB (FAT32)
- **Root (/)**: 100GB (ext4) - Pop!_OS
- **Home (/home)**: 200GB (ext4) - User data
- **Swap**: 32GB (swap) - For hibernation
- **Data (/data)**: Remaining space (ext4) - Projects, media
- **Windows Recovery**: 50GB (NTFS) - Keep Windows partition

#### Step 5: Installation Process
1. Boot from USB
2. Choose "Install Pop!_OS"
3. Select "Custom (Advanced)" partitioning
4. Create partitions as outlined above
5. Set bootloader to EFI partition
6. Complete installation

### Post-Installation Setup

#### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop neofetch
```

#### 2. Install NVIDIA Drivers (if not pre-installed)
```bash
# Check GPU detection
lspci | grep -i nvidia
nvidia-smi

# Install NVIDIA drivers (Pop!_OS usually has these)
sudo apt install nvidia-driver-525
sudo reboot
```

#### 3. Install Development Tools
```bash
# Node.js (for Vengeance system)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python and AI/ML tools
sudo apt install python3-pip python3-venv
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Docker (for containerized AI workloads)
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

#### 4. Install Vengeance System
```bash
# Clone your Aurora AI Robbiverse
git clone https://github.com/yourusername/aurora-ai-robbiverse.git
cd aurora-ai-robbiverse

# Install dependencies
npm install

# Test Vengeance system
./bin/vengeance
```

#### 5. GPU Optimization for AI/ML
```bash
# Install CUDA toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt update
sudo apt install cuda-toolkit

# Verify CUDA installation
nvcc --version
nvidia-smi
```

### Vengeance System Migration

#### 1. Transfer Aurora AI Project
```bash
# From your MacBook, copy the project
scp -r /Users/allanperetz/aurora-ai-robbiverse/ vengeance@192.168.1.xxx:/home/vengeance/
```

#### 2. Configure Vengeance for Linux
```bash
# Update paths in configuration
sed -i 's|/Users/allanperetz/aurora-ai-robbiverse|/home/vengeance/aurora-ai-robbiverse|g' src/db.js
sed -i 's|/Users/allanperetz/aurora-ai-robbiverse|/home/vengeance/aurora-ai-robbiverse|g' bin/vengeance
```

#### 3. Set up GPU Training Environment
```bash
# Install Ollama for local LLM inference
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models optimized for RTX 4090
ollama pull llama3.1:8b
ollama pull codellama:7b
ollama pull mistral:7b

# Test GPU inference
ollama run llama3.1:8b "Hello from Vengeance RTX 4090!"
```

### Performance Optimization

#### 1. GPU Memory Management
```bash
# Create GPU monitoring script
cat > ~/gpu_monitor.sh << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== Vengeance RTX 4090 Status ==="
    nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits
    echo "Press Ctrl+C to exit"
    sleep 5
done
EOF

chmod +x ~/gpu_monitor.sh
```

#### 2. System Monitoring
```bash
# Install system monitoring tools
sudo apt install htop iotop nethogs
sudo apt install neofetch

# Create system status dashboard
cat > ~/vengeance_status.sh << 'EOF'
#!/bin/bash
echo "🔥 VENGEANCE SYSTEM STATUS 🔥"
echo "================================"
neofetch --stdout
echo ""
echo "GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits
echo ""
echo "System Resources:"
htop -n 1
EOF

chmod +x ~/vengeance_status.sh
```

### Emergency Recovery

#### 1. Windows Recovery
- Keep Windows recovery USB handy
- Can dual-boot if needed
- Windows partition preserved during installation

#### 2. Data Recovery
- All data backed up to C:\VengeanceBackup
- Can access from Linux if needed
- Cloud backup recommended

### Next Steps After Installation

1. **Test Vengeance System**: Run `./bin/vengeance` and verify GPU training
2. **Configure SSH Access**: Set up SSH from MacBook to Vengeance
3. **Set up Remote Development**: VS Code Remote SSH
4. **Configure GPU Monitoring**: Set up alerts for GPU utilization
5. **Test AI/ML Workloads**: Run your Aurora AI training scripts

### Contact Information
- Keep this guide handy during installation
- Test each step before proceeding
- Have Windows recovery USB ready
- Backup everything twice!

---

**Ready to proceed?** Let me know when you're ready to start the installation process!



