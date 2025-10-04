// Test Prove Robbie RTX 4090
import ProveRobbieRTX4090 from './prove-robbie-rtx4090.js';

console.log('🔥 PROVING ROBBIE IS WORKING ON RTX 4090...');

const prover = new ProveRobbieRTX4090();

try {
  console.log('🚀 Starting complete proof...');
  
  // Run complete proof
  const success = await prover.runCompleteProof();
  
  if (success) {
    console.log('\n✅ PROOF SUCCESSFUL!');
    console.log('===================');
    console.log('Robbie is working on your RTX 4090!');
  } else {
    console.log('\n❌ PROOF FAILED!');
    console.log('===============');
    console.log('Robbie is not working properly');
  }
  
} catch (error) {
  console.error('❌ Proof test failed:', error);
}

