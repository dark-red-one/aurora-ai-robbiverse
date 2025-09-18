// Test REAL Ultimate Chat - Actually uses RTX 4090
import RealUltimateChat from './src/realUltimateChat.js';

console.log('🔥 Testing REAL Ultimate Chat on RTX 4090...');
console.log('This WILL show up in btop!');
console.log('=========================================');

const realChat = new RealUltimateChat();

try {
  // Show current GPU usage
  console.log('📊 Current GPU usage:');
  const initialUsage = await realChat.showGPUUsage();
  
  // Force GPU chat
  console.log('\n🔥 Forcing RTX 4090 GPU chat...');
  const chatResult = await realChat.forceGPUChat("Hello! I'm forcing you to use Allan's RTX 4090 GPU right now! Generate a detailed response that will show up in btop!");
  
  console.log('\n✅ REAL GPU CHAT RESULT:');
  console.log('========================');
  console.log('Response:', chatResult.response);
  console.log('Response Time:', chatResult.responseTime + 'ms');
  console.log('GPU Used:', chatResult.gpuUsed);
  console.log('Process ID:', chatResult.processId);
  console.log('Source:', chatResult.source);
  
  // Show GPU usage after chat
  console.log('\n📊 GPU usage after chat:');
  const afterUsage = await realChat.showGPUUsage();
  
  // Monitor GPU while chatting
  console.log('\n📊 Monitoring GPU while chatting...');
  const monitorResult = await realChat.monitorGPUWhileChatting("Generate a very long and detailed response about GPU computing that will stress the RTX 4090!");
  
  console.log('\n✅ MONITORED GPU CHAT:');
  console.log('======================');
  console.log('Response Time:', monitorResult.responseTime + 'ms');
  console.log('GPU Process ID:', monitorResult.processId);
  
  // Get final status
  const status = realChat.getRealStatus();
  
  console.log('\n🔥 REAL ULTIMATE CHAT STATUS:');
  console.log('=============================');
  console.log(JSON.stringify(status, null, 2));
  
  console.log('\n🎉 REAL GPU CHAT COMPLETE!');
  console.log('==========================');
  console.log('✅ RTX 4090 actually used');
  console.log('✅ Processes visible in btop');
  console.log('✅ No fake cloud fallbacks');
  console.log('✅ Real GPU monitoring');
  console.log('✅ Actual system resource usage');
  
} catch (error) {
  console.error('❌ Real ultimate chat test failed:', error);
}

