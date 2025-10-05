// Test Web Terminal Real Monitoring - 11th Commandment: Always use tools to mitigate hallucinations!
import WebTerminalRealMonitoring from './src/webTerminalRealMonitoring.js';

console.log('🔥 Testing Web Terminal Real Monitoring - 11th Commandment!');

const webMonitor = new WebTerminalRealMonitoring();

try {
  console.log('📊 Getting REAL GPU status via web terminal...');
  
  // Get real GPU status
  const realGPUStatus = await webMonitor.getRealGPUStatus();
  
  console.log('\n📊 REAL GPU STATUS (No Hallucinations):');
  console.log('=====================================');
  console.log(JSON.stringify(realGPUStatus, null, 2));
  
  console.log('\n🚀 Starting Ollama with REAL monitoring...');
  
  // Start Ollama with real monitoring
  const ollamaResult = await webMonitor.startOllamaWithRealMonitoring();
  
  console.log('\n✅ OLLAMA WITH REAL MONITORING:');
  console.log('==============================');
  console.log(JSON.stringify(ollamaResult, null, 2));
  
  console.log('\n📊 Monitoring GPU in real-time for 30 seconds...');
  
  // Monitor GPU in real-time
  await webMonitor.monitorGPURealTime(30);
  
  console.log('\n✅ Web Terminal Real Monitoring test completed!');
  
} catch (error) {
  console.error('❌ Web Terminal Real Monitoring test failed:', error);
}

