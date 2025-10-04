// Test Wallet Open Acceleration - REAL RESULTS!
import WalletOpenAcceleration from './src/walletOpenAcceleration.js';

console.log('💰 Starting WALLET OPEN Acceleration Test...');

const walletAccel = new WalletOpenAcceleration();

try {
  console.log('🔥 WALLET OPEN - Starting maximum spending...');
  
  // Start spending for results
  const result = await walletAccel.startSpending();
  
  console.log('✅ WALLET OPEN Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Monitor spending for 3 minutes
  console.log('📊 Monitoring WALLET OPEN spending for 3 minutes...');
  
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = walletAccel.getSpendingStatus();
    console.log(`\n💰 WALLET OPEN (${i + 1}/36) 💰`);
    console.log('========================');
    console.log(`Total Spent: $${status.totalSpent.toFixed(2)}`);
    console.log(`Development Speed: ${status.developmentSpeed}%`);
    console.log(`GPU Utilization: ${status.gpuUtilization}%`);
    console.log(`Cost Per Hour: $${status.costPerHour}`);
    console.log(`Results: ${status.results.length} items`);
    console.log(`Spending: ${status.isSpending ? '🟢 YES' : '🔴 NO'}`);
    console.log('========================\n');
  }
  
  // Stop spending
  console.log('🛑 Stopping WALLET OPEN spending...');
  await walletAccel.stopSpending();
  
  console.log('✅ WALLET OPEN test completed!');
  
} catch (error) {
  console.error('❌ WALLET OPEN failed:', error);
}

