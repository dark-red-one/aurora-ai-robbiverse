// Test REAL RunPod B200 GPU Training
import RunPodRealSSH from './src/runpodRealSSH.js';

console.log('🚀 Starting REAL RunPod B200 GPU Training...');

const runpodSSH = new RunPodRealSSH();

try {
  console.log('🔥 Connecting to RunPod B200...');
  
  // Start real GPU training
  const result = await runpodSSH.startRealGPUTraining();
  
  console.log('✅ REAL GPU Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring GPU for 30 seconds...');
  
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await runpodSSH.monitorTraining();
    console.log(`\n🔥 B200 GPU MONITORING (${i + 1}/6) 🔥`);
    console.log('========================');
    console.log(`GPU Status: ${status.gpuStatus}`);
    console.log(`Ollama Running: ${status.ollamaRunning ? '🟢 YES' : '🔴 NO'}`);
    console.log('========================\n');
  }
  
  // Disconnect
  await runpodSSH.disconnect();
  
  console.log('✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Real RunPod GPU training failed:', error);
  
  // Try to disconnect
  try {
    await runpodSSH.disconnect();
  } catch (disconnectError) {
    console.error('❌ Disconnect failed:', disconnectError);
  }
}

