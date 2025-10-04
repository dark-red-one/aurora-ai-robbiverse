// Test Vengeance Simple GPU Training System
import VengeanceSimple from './src/vengeanceSimple.js';

console.log('🚀 Starting Vengeance Simple GPU Training System...');

const vengeance = new VengeanceSimple();

try {
  console.log('🔥 Starting Vengeance Simple training on B200...');
  
  // Start comprehensive training
  const result = await vengeance.startVengeanceTraining();
  
  console.log('✅ Vengeance Simple Training Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor for a bit
  console.log('📊 Monitoring Vengeance Simple for 60 seconds...');
  
  for (let i = 0; i < 12; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = vengeance.getSystemStatus();
    console.log(`\n🔥 VENGEANCE SIMPLE MONITORING (${i + 1}/12) 🔥`);
    console.log('========================');
    console.log(`GPU Utilization: ${vengeance.gpuUtilization}%`);
    console.log(`Memory Usage: ${vengeance.memoryUsage}%`);
    console.log(`Training Data: ${vengeance.trainingData.length} samples`);
    console.log(`Systems Running: ${Object.keys(status).length}`);
    console.log(`System Status: ${JSON.stringify(status, null, 2)}`);
    console.log('========================\n');
  }
  
  console.log('✅ Vengeance Simple test completed successfully!');
  
} catch (error) {
  console.error('❌ Vengeance Simple training failed:', error);
}

