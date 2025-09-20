# Simple RunPod Configuration (Copy/Paste)

## Pod Settings
- **Pod Name**: `aurora-gpu-simple`
- **Template**: RunPod PyTorch 2.1
- **Container Image**: `runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04`

## Hardware
- **GPU Count**: 1
- **GPU Type**: RTX 4090
- **Container Disk**: 20 GB
- **Volume Disk**: 200 GB
- **Volume Mount Path**: `/workspace`

## Network & Ports
- **Expose HTTP Ports**: 8888
- **Expose TCP Ports**: 22
- **SSH Terminal Access**: ✅ Enabled
- **Start Jupyter Notebook**: ✅ Enabled (optional)
- **Encrypt Volume**: ✅ Enabled

## Configuration
- **Start Command**: *LEAVE EMPTY*
- **Environment Variables**: *LEAVE EMPTY*

## After Deployment
Once the pod is running, I'll help you:
1. SSH in and test basic functionality
2. Install database client
3. Test GPU and database connectivity
4. Set up monitoring and health checks

This simple config should deploy in 2-3 minutes and actually work without issues.
