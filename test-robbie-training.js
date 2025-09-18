// Test Robbie GPU Training
import RobbieTrainingDashboard from './src/robbieTrainingDashboard.js';

console.log('🚀 Starting Robbie GPU Training System...');
console.log('Dashboard type:', typeof RobbieTrainingDashboard);

try {
  const dashboard = new RobbieTrainingDashboard();
  console.log('✅ Dashboard created successfully!');
  
  // Add sample data
  dashboard.addSampleData();
  
  // Start training
  dashboard.startFullTraining().then(result => {
    console.log('✅ Training started successfully!');
    console.log('Result:', result);
  }).catch(error => {
    console.error('❌ Training failed:', error);
  });
  
} catch (error) {
  console.error('❌ Error creating dashboard:', error);
}