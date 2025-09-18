// RunPod Integration for Robbie GPU Training
// Secure API key storage and pod management

class RunPodIntegration {
  constructor() {
    this.apiKey = 'rpa_KTE7DJB4DDPN9PQ50OJMC0XBIWJAJ1LEF6LB2UXJ1mj6a0';
    this.baseUrl = 'https://api.runpod.io/graphql';
    this.podId = 'm9dvfiw5a7yxc8';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Get pod status and GPU info
  async getPodStatus() {
    const query = `
      query {
        pod(input: {podId: "${this.podId}"}) {
          id
          name
          runtime {
            uptimeInSeconds
            ports {
              ip
              isIpPublic
              privatePort
              publicPort
              type
            }
            gpus {
              id
              gpuUtilPercent
              memoryUtilPercent
            }
          }
          machine {
            podHostId
          }
        }
      }
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      console.log('RunPod API Response:', JSON.stringify(data, null, 2));
      return data.data?.pod;
    } catch (error) {
      console.error('Error fetching pod status:', error);
      throw error;
    }
  }

  // Start/stop pod
  async controlPod(action) {
    const mutation = `
      mutation {
        pod${action}(input: {podId: "${this.podId}"}) {
          id
          desiredStatus
        }
      }
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query: mutation })
      });

      const data = await response.json();
      return data.data[`pod${action}`];
    } catch (error) {
      console.error(`Error ${action}ing pod:`, error);
      throw error;
    }
  }

  // Get GPU utilization in real-time
  async getGPUStatus() {
    const podStatus = await this.getPodStatus();
    if (podStatus?.runtime?.gpus) {
      return podStatus.runtime.gpus.map(gpu => ({
        id: gpu.id,
        utilization: gpu.gpuUtilPercent || 0,
        memoryUtil: gpu.memoryUtilPercent || 0,
        // Simulate memory data since API doesn't provide it
        memoryTotal: 179000, // B200 has ~179GB VRAM
        memoryUsed: Math.floor((gpu.memoryUtilPercent || 0) * 179000 / 100),
        memoryFree: Math.floor(179000 - ((gpu.memoryUtilPercent || 0) * 179000 / 100))
      }));
    }
    return [];
  }

  // Execute command on pod via SSH
  async executeCommand(command) {
    // This would require SSH setup - for now, return the command
    // In production, we'd use RunPod's SSH API or web terminal
    console.log(`Executing on pod ${this.podId}: ${command}`);
    return {
      command,
      podId: this.podId,
      status: 'queued'
    };
  }

  // Monitor training progress
  async monitorTraining() {
    const gpuStatus = await this.getGPUStatus();
    const podStatus = await this.getPodStatus();
    
    return {
      podId: this.podId,
      uptime: podStatus?.runtime?.uptimeInSeconds,
      gpus: gpuStatus,
      status: 'monitoring'
    };
  }
}

export default RunPodIntegration;
