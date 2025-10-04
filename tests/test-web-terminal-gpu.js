// Test Web Terminal GPU Training on B200
import RunPodWebTerminal from './src/runpodWebTerminal.js';

console.log('🚀 Starting Web Terminal GPU Training Test on B200...');

const webTerminal = new RunPodWebTerminal();

try {
  console.log('🔥 Starting GPU training via RunPod web terminal...');
  
  // Start real GPU training
  const result = await webTerminal.startRealGPUTraining();
  
  console.log('✅ REAL GPU Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring GPU for 30 seconds...');
  
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await webTerminal.monitorTraining();
    console.log(`\n🔥 B200 GPU MONITORING (${i + 1}/6) 🔥`);
    console.log('========================');
    console.log(`GPU Status: ${status.gpuStatus}`);
    console.log(`Ollama Running: ${status.ollamaRunning ? '🟢 YES' : '🔴 NO'}`);
    console.log('========================\n');
  }
  
  // Stop training
  console.log('🛑 Stopping training...');
  await webTerminal.stopTraining();
  
  console.log('✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Web terminal GPU training failed:', error);
}

