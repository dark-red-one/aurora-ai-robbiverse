// Test Vengeance GPU Training System
import VengeanceGPUTraining from './src/vengeanceGPUTraining.js';

console.log('🚀 Starting Vengeance GPU Training System...');

const vengeance = new VengeanceGPUTraining();

try {
  console.log('🔥 Starting Vengeance training on B200...');
  
  // Start comprehensive training
  const result = await vengeance.startVengeanceTraining();
  
  console.log('✅ Vengeance Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring Vengeance for 60 seconds...');
  
  for (let i = 0; i < 12; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = vengeance.getSystemStatus();
    console.log(`\n🔥 VENGEANCE MONITORING (${i + 1}/12) 🔥`);
    console.log('========================');
    console.log(`GPU Utilization: ${vengeance.gpuUtilization}%`);
    console.log(`Memory Usage: ${vengeance.memoryUsage}%`);
    console.log(`Training Data: ${vengeance.trainingData.length} samples`);
    console.log(`Systems Running: ${Object.keys(status).length}`);
    console.log('========================\n');
  }
  
  console.log('✅ Vengeance test completed successfully!');
  
} catch (error) {
  console.error('❌ Vengeance training failed:', error);
}

