// Test RunPod API Command Execution
import RunPodAPIExecution from './src/runpodAPIExecution.js';

console.log('🚀 Starting RunPod API Command Execution...');

const apiExecution = new RunPodAPIExecution();

try {
  console.log('🔥 Starting GPU training via RunPod API...');
  
  // Start GPU training
  const result = await apiExecution.startGPUTraining();
  
  console.log('✅ GPU Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring GPU for 30 seconds...');
  
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await apiExecution.monitorTraining();
    console.log(`\n🔥 B200 GPU MONITORING (${i + 1}/6) 🔥`);
    console.log('========================');
    console.log(`Pod Status: ${JSON.stringify(status.podStatus, null, 2)}`);
    console.log(`GPU Status: ${status.gpuStatus}`);
    console.log('========================\n');
  }
  
  console.log('✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ API execution failed:', error);
}

