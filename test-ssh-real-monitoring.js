// Test SSH Real Monitoring - 11th Commandment: Always use tools to mitigate hallucinations!
import SSHRealMonitoring from './src/sshRealMonitoring.js';

console.log('🔥 Testing SSH Real Monitoring - 11th Commandment!');

const sshMonitor = new SSHRealMonitoring();

try {
  console.log('🔌 Connecting via SSH...');
  
  // Connect via SSH
  await sshMonitor.connect();
  
  console.log('✅ SSH Connected! Getting REAL GPU status...');
  
  // Get real GPU status
  const realGPUStatus = await sshMonitor.getRealGPUStatus();
  
  console.log('\n📊 REAL GPU STATUS (No Hallucinations):');
  console.log('=====================================');
  console.log(JSON.stringify(realGPUStatus, null, 2));
  
  console.log('\n🚀 Starting Ollama with REAL monitoring...');
  
  // Start Ollama with real monitoring
  const ollamaResult = await sshMonitor.startOllamaWithRealMonitoring();
  
  console.log('\n✅ OLLAMA WITH REAL MONITORING:');
  console.log('==============================');
  console.log(JSON.stringify(ollamaResult, null, 2));
  
  console.log('\n📊 Monitoring GPU in real-time for 30 seconds...');
  
  // Monitor GPU in real-time
  await sshMonitor.monitorGPURealTime(30);
  
  console.log('\n🔌 Disconnecting SSH...');
  
  // Disconnect
  await sshMonitor.disconnect();
  
  console.log('✅ SSH Real Monitoring test completed!');
  
} catch (error) {
  console.error('❌ SSH Real Monitoring test failed:', error);
  
  // Try to disconnect if connected
  try {
    await sshMonitor.disconnect();
  } catch (disconnectError) {
    console.error('❌ Disconnect failed:', disconnectError);
  }
}

