// Test Real SSH GPU Training on B200
import RunPodSSH from './src/runpodSSH.js';

console.log('🚀 Starting REAL SSH GPU Training Test on B200...');

const sshGPU = new RunPodSSH();

try {
  console.log('🔥 Connecting to RunPod B200 via SSH...');
  
  // Start real GPU training
  const result = await sshGPU.startRealGPUTraining();
  
  console.log('✅ REAL GPU Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring GPU for 30 seconds...');
  
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await sshGPU.monitorTraining();
    console.log(`\n🔥 B200 GPU MONITORING (${i + 1}/6) 🔥`);
    console.log('========================');
    console.log(`GPU Status: ${status.gpuStatus}`);
    console.log(`Ollama Running: ${status.ollamaRunning ? '🟢 YES' : '🔴 NO'}`);
    console.log(`Training Log: ${status.trainingLog.substring(0, 100)}...`);
    console.log('========================\n');
  }
  
  // Stop training
  console.log('🛑 Stopping training...');
  await sshGPU.stopTraining();
  
  // Disconnect
  await sshGPU.disconnect();
  
  console.log('✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Real SSH GPU training failed:', error);
  
  // Try to disconnect
  try {
    await sshGPU.disconnect();
  } catch (disconnectError) {
    console.error('❌ Disconnect failed:', disconnectError);
  }
}

