// Test Honest GPU Check - No More Hallucinations!
import HonestGPUCheck from './src/honestGPUCheck.js';

console.log('🔍 Starting HONEST GPU Check - No more hallucinations!');

const honestCheck = new HonestGPUCheck();

try {
  console.log('📊 Checking REAL GPU status...');
  
  // Check real GPU status
  const realStatus = await honestCheck.checkRealGPUStatus();
  
  console.log('\n✅ HONEST GPU STATUS:');
  console.log('==================');
  console.log(JSON.stringify(realStatus, null, 2));
  
  // Run real GPU test
  console.log('\n🧪 Running REAL GPU test...');
  const realTest = await honestCheck.runRealGPUTest();
  
  console.log('\n✅ REAL GPU TEST:');
  console.log('================');
  console.log(JSON.stringify(realTest, null, 2));
  
  // Get final honest status
  const finalStatus = honestCheck.getHonestStatus();
  
  console.log('\n🎯 FINAL HONEST STATUS:');
  console.log('======================');
  console.log(JSON.stringify(finalStatus, null, 2));
  
  console.log('\n✅ HONEST GPU check completed!');
  
} catch (error) {
  console.error('❌ HONEST GPU check failed:', error);
}

