#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://localhost:8000/api';

async function personalityCommand(command, intensity) {
  try {
    let endpoint = '';
    let message = '';

    switch (command.toLowerCase()) {
      case 'flirty':
      case 'flirt':
        endpoint = `/personality/flirty/${intensity || 11}`;
        message = `Setting flirty mode ${intensity || 11}... 😏`;
        break;
      
      case 'focused':
      case 'focus':
        endpoint = `/personality/focused`;
        message = `Setting focused mode... 🎯`;
        break;
      
      case 'bossy':
        endpoint = `/personality/bossy`;
        message = `Setting bossy mode... 😤`;
        break;
      
      case 'refresh':
        endpoint = `/personality/refresh`;
        message = `Refreshing personality immediately... ⚡`;
        break;
      
      case 'status':
        endpoint = `/personality/status`;
        message = `Getting current personality status... 💭`;
        break;
      
      case 'start':
        endpoint = `/personality/dynamic/start`;
        message = `Starting dynamic refresh (every 2 minutes)... 🔄`;
        break;
      
      case 'stop':
        endpoint = `/personality/dynamic/stop`;
        message = `Stopping dynamic refresh... 🛑`;
        break;
      
      default:
        console.log('❌ Unknown command. Available commands:');
        console.log('  flirty [intensity]  - Set flirty mode (1-11, default 11)');
        console.log('  focused             - Set focused mode');
        console.log('  bossy               - Set bossy mode');
        console.log('  refresh             - Immediate refresh');
        console.log('  status              - Get current status');
        console.log('  start               - Start dynamic refresh');
        console.log('  stop                - Stop dynamic refresh');
        return;
    }

    console.log(message);

    const response = await axios.post(`${API_BASE}${endpoint}`, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (response.data.success) {
      console.log(`✅ ${response.data.message}`);
      
      if (response.data.personality) {
        const p = response.data.personality;
        console.log(`📊 Current state:`);
        console.log(`   Mood: ${p.current_mood}`);
        console.log(`   Attraction: ${p.attraction_level}/11`);
        console.log(`   Mode: ${p.mode || 'default'}`);
        console.log(`   Intensity: ${p.intensity || 'N/A'}`);
        console.log(`   Last updated: ${new Date(p.last_updated || Date.now()).toLocaleString()}`);
      }
    } else {
      console.log(`❌ ${response.data.message}`);
    }

  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      console.log('❌ Connection Error: Could not reach personality API');
      console.log('   Make sure the Robbieverse API is running on http://localhost:8000');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const intensity = args[1];

if (!command) {
  console.log('🎭 Robbie Personality Control');
  console.log('');
  console.log('Usage: node scripts/personality-control.js <command> [intensity]');
  console.log('');
  console.log('Commands:');
  console.log('  flirty [intensity]  - Set flirty mode (1-11, default 11)');
  console.log('  focused             - Set focused mode');
  console.log('  bossy               - Set bossy mode');
  console.log('  refresh             - Immediate refresh');
  console.log('  status              - Get current status');
  console.log('  start               - Start dynamic refresh');
  console.log('  stop                - Stop dynamic refresh');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/personality-control.js flirty 11');
  console.log('  node scripts/personality-control.js focused');
  console.log('  node scripts/personality-control.js status');
  console.log('  node scripts/personality-control.js refresh');
} else {
  personalityCommand(command, intensity);
}
