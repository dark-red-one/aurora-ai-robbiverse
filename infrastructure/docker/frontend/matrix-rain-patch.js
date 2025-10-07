// Add this function to the HTML file after createMatrixParticles function
function createMatrixRain() {
    const container = document.getElementById('matrixRainBg');
    if (!container) return;

    const characters = 'ROBBIE0123456789@#$%^&*()<>{}[]|\\/~`';
    const specialChars = '★☆◆◇●○▲△■□▲▼◀▶';

    // Create matrix columns for main background
    for (let i = 0; i < 15; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column-bg';
        column.style.left = Math.random() * 100 + '%';
        column.style.animationDuration = (Math.random() * 6 + 3) + 's';
        column.style.animationDelay = Math.random() * 2 + 's';
        
        let text = '';
        const columnLength = Math.floor(Math.random() * 8) + 8;
        for (let j = 0; j < columnLength; j++) {
            const char = Math.random() < 0.2 ?
                specialChars[Math.floor(Math.random() * specialChars.length)] :
                characters[Math.floor(Math.random() * characters.length)];
            
            const isSpecial = Math.random() < 0.25;
            if (isSpecial) {
                text += `<span class="matrix-glitch">${char}</span><br>`;
            } else {
                text += char + '<br>';
            }
        }
        column.innerHTML = text;
        container.appendChild(column);
    }
}

// Add this call to the window load event after setupBackgroundCycling()
// createMatrixRain();
