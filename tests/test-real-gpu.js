// Test Real GPU Training on B200
import RealGPUTraining from './src/realGPUTraining.js';

console.log('🚀 Starting REAL B200 GPU Training Test...');

const gpuTraining = new RealGPUTraining();

try {
  console.log('🔥 Initializing B200 GPU training...');
  
  const result = await gpuTraining.startRealTraining();
  
  console.log('✅ REAL GPU Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Keep monitoring for a bit
  console.log('📊 Monitoring GPU for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const status = gpuTraining.getStatus();
  console.log('📈 Final Status:');
  console.log(JSON.stringify(status, null, 2));
  
} catch (error) {
  console.error('❌ Real GPU training failed:', error);
}

