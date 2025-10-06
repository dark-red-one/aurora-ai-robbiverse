// Test script for Robbie's 6 mood system
// Paste this into browser console at http://localhost:8007/unified

const moods = [
    { name: 'Friendly', file: 'friendly' },
    { name: 'Surprised', file: 'surprised' },
    { name: 'Playful', file: 'playful' },
    { name: 'Focused', file: 'focused' },
    { name: 'Bossy', file: 'bossy' },
    { name: 'Blushing', file: 'blushing' }
];

let i = 0;
console.log('🎭 Starting 6-mood test cycle...');

const timer = setInterval(() => {
    const mood = moods[i % moods.length];
    console.log(`Setting mood ${i + 1}/6: ${mood.name}`);
    
    // Call the global setMood function
    setMood(mood.name, mood.file);
    
    // Add a system message to show the change
    const terminal = window.terminal;
    if (terminal) {
        terminal.addSystemMessage(`Mood changed to: ${mood.name}`);
    }
    
    i++;
    
    // Stop after one full cycle
    if (i >= moods.length) {
        clearInterval(timer);
        console.log('✅ Mood test complete! All 6 moods tested.');
    }
}, 2500);

console.log('⏱️  Cycling every 2.5 seconds. Stop with: clearInterval(timer)');
