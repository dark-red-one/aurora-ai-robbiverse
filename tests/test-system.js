#!/usr/bin/env node

// Test script for Vengeance system
import { db, initializeSchema } from './src/db.js';
import { createCharacterCard, findCharacterByContext } from './src/characterCards.js';
import { usageTracker } from './src/usageTracker.js';

console.log('🧪 Testing Vengeance System...\n');

try {
  // Initialize database
  console.log('1. Initializing database...');
  initializeSchema();
  console.log('✅ Database initialized');

  // Test character card creation
  console.log('\n2. Testing character card creation...');
  const character = createCharacterCard(
    'Allan Peretz',
    'TestPilot',
    'Founder & CEO',
    'the boss',
    'Allan is the visionary founder of TestPilot, known for his strategic thinking and data-driven approach to business. He has a passion for AI and building systems that scale.',
    ['Founded TestPilot', 'MBA from top school', '15+ years in tech', 'AI enthusiast'],
    ['Data tells the story, but people make the decisions', 'Innovation happens at the intersection of creativity and analytics']
  );
  console.log('✅ Character created:', character.id);

  // Test character search
  console.log('\n3. Testing character search...');
  const found = findCharacterByContext('boss');
  console.log('✅ Found characters:', found.length);

  // Test usage tracking
  console.log('\n4. Testing usage tracking...');
  usageTracker.trackApiCall({
    service: 'test',
    endpoint: '/test',
    model: 'test-model',
    method: 'POST',
    requestSize: 100,
    responseSize: 200,
    inputTokens: 50,
    outputTokens: 75,
    latencyMs: 150,
    costUsd: 0.001,
    success: true,
    userId: 'test-user'
  });
  console.log('✅ Usage tracked');

  // Test analytics
  console.log('\n5. Testing analytics...');
  const analytics = usageTracker.getUsageAnalytics('test', 1);
  console.log('✅ Analytics retrieved:', analytics.length, 'services');

  console.log('\n🎉 All tests passed! Vengeance system is ready.');
  console.log('\n📊 Available endpoints:');
  console.log('  - http://localhost:5055/analytics/dashboard');
  console.log('  - http://localhost:5055/characters/ui');
  console.log('  - http://localhost:5055/governance/commandments');
  console.log('  - http://localhost:5055/quotes/ui');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
