// Polling UI Components - Live streaming votes with TestPilot design
// Integrates with the team polling system

class PollingUI {
  constructor() {
    this.activePoll = null;
    this.voteStream = null;
    this.participationRate = 0;
    this.isVoting = false;
  }

  // Generate HTML for polling interface
  generatePollingHTML() {
    return `
      <div class="tp-polling-container">
        <div class="tp-polling-header">
          <h2>📊 Team Polls</h2>
          <div class="tp-poll-status">
            <span class="tp-status-indicator" id="pollStatus">Loading...</span>
            <span class="tp-participation-rate" id="participationRate">0% participation</span>
          </div>
        </div>

        <div class="tp-current-poll" id="currentPoll">
          <div class="tp-poll-question" id="pollQuestion">
            Loading current poll...
          </div>
          
          <div class="tp-poll-details" id="pollDetails">
            <a href="#" id="detailsLink" target="_blank" class="tp-details-link">
              View Details →
            </a>
          </div>

          <div class="tp-poll-options" id="pollOptions">
            <!-- Options will be populated dynamically -->
          </div>

          <div class="tp-poll-results" id="pollResults">
            <!-- Results will be populated dynamically -->
          </div>
        </div>

        <div class="tp-live-vote-stream" id="liveVoteStream">
          <h3>🔴 Live Vote Stream</h3>
          <div class="tp-vote-feed" id="voteFeed">
            <div class="tp-vote-item tp-placeholder">
              <span class="tp-vote-emoji">⏳</span>
              <span class="tp-vote-text">Waiting for votes...</span>
              <span class="tp-vote-time">--:--</span>
            </div>
          </div>
        </div>

        <div class="tp-poll-history" id="pollHistory">
          <h3>📈 Recent Polls</h3>
          <div class="tp-history-list" id="historyList">
            <!-- History will be populated dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  // Generate CSS for polling interface
  generatePollingCSS() {
    return `
      .tp-polling-container {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #F5F5F5;
      }

      .tp-polling-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #E5E5E5;
      }

      .tp-polling-header h2 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .tp-poll-status {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .tp-status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: #E6F2FF;
        color: #0066CC;
        border: 1px solid #B3D9FF;
      }

      .tp-status-indicator.active {
        background: #00C851;
        color: white;
        border-color: #00A041;
      }

      .tp-status-indicator.completed {
        background: #FF6B35;
        color: white;
        border-color: #E55A2B;
      }

      .tp-participation-rate {
        font-size: 0.875rem;
        color: #4A4A4A;
        font-weight: 500;
      }

      .tp-current-poll {
        margin-bottom: 2rem;
      }

      .tp-poll-question {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 1rem;
        line-height: 1.4;
      }

      .tp-poll-details {
        margin-bottom: 1.5rem;
      }

      .tp-details-link {
        color: #0066CC;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #0066CC;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
      }

      .tp-details-link:hover {
        background: #0066CC;
        color: white;
        transform: translateY(-1px);
      }

      .tp-poll-options {
        display: grid;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .tp-poll-option {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        border: 2px solid #E5E5E5;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
      }

      .tp-poll-option:hover {
        border-color: #0066CC;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.1);
      }

      .tp-poll-option.selected {
        border-color: #0066CC;
        background: #E6F2FF;
      }

      .tp-poll-option.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .tp-option-emoji {
        font-size: 1.5rem;
      }

      .tp-option-text {
        flex: 1;
        font-weight: 500;
        color: #1A1A1A;
      }

      .tp-option-vote-count {
        font-size: 0.875rem;
        color: #4A4A4A;
        font-weight: 600;
      }

      .tp-poll-results {
        background: #FAFAFA;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .tp-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .tp-results-title {
        font-weight: 600;
        color: #1A1A1A;
        margin: 0;
      }

      .tp-total-votes {
        font-size: 0.875rem;
        color: #4A4A4A;
      }

      .tp-result-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #E5E5E5;
      }

      .tp-result-emoji {
        font-size: 1.25rem;
      }

      .tp-result-text {
        flex: 1;
        font-weight: 500;
        color: #1A1A1A;
      }

      .tp-result-bar {
        flex: 2;
        height: 8px;
        background: #E5E5E5;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .tp-result-fill {
        height: 100%;
        background: linear-gradient(90deg, #0066CC 0%, #FF6B35 100%);
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .tp-result-percentage {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1A1A1A;
        min-width: 3rem;
        text-align: right;
      }

      .tp-live-vote-stream {
        background: #F8F9FA;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .tp-live-vote-stream h3 {
        margin: 0 0 1rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .tp-vote-feed {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #E5E5E5;
        border-radius: 0.5rem;
        background: white;
      }

      .tp-vote-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #F5F5F5;
        animation: slideIn 0.3s ease;
      }

      .tp-vote-item:last-child {
        border-bottom: none;
      }

      .tp-vote-item.tp-placeholder {
        opacity: 0.6;
        font-style: italic;
      }

      .tp-vote-emoji {
        font-size: 1.25rem;
      }

      .tp-vote-text {
        flex: 1;
        font-size: 0.875rem;
        color: #4A4A4A;
      }

      .tp-vote-time {
        font-size: 0.75rem;
        color: #8A8A8A;
        font-family: monospace;
      }

      .tp-poll-history {
        background: #FAFAFA;
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      .tp-poll-history h3 {
        margin: 0 0 1rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-history-list {
        display: grid;
        gap: 1rem;
      }

      .tp-history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #E5E5E5;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-history-item:hover {
        border-color: #0066CC;
        transform: translateY(-1px);
      }

      .tp-history-question {
        font-weight: 500;
        color: #1A1A1A;
        margin: 0;
      }

      .tp-history-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.875rem;
        color: #4A4A4A;
      }

      .tp-history-status {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .tp-history-status.completed {
        background: #E6F2FF;
        color: #0066CC;
      }

      .tp-history-status.active {
        background: #E6F2FF;
        color: #0066CC;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .tp-live-indicator {
        animation: pulse 2s infinite;
      }
    `;
  }

  // Update poll display
  updatePollDisplay(pollData) {
    this.activePoll = pollData;
    
    // Update question
    document.getElementById('pollQuestion').textContent = pollData.poll.question;
    
    // Update details link
    const detailsLink = document.getElementById('detailsLink');
    if (pollData.poll.details_link) {
      detailsLink.href = pollData.poll.details_link;
      detailsLink.style.display = 'inline-flex';
    } else {
      detailsLink.style.display = 'none';
    }

    // Update status
    const statusIndicator = document.getElementById('pollStatus');
    statusIndicator.textContent = pollData.poll.status === 'active' ? 'Active' : 'Completed';
    statusIndicator.className = `tp-status-indicator ${pollData.poll.status}`;

    // Update participation rate
    document.getElementById('participationRate').textContent = 
      `${pollData.participation_rate}% participation`;

    // Update options
    this.updatePollOptions(pollData.poll.options, pollData.results);
    
    // Update results
    this.updatePollResults(pollData.results, pollData.total_votes);
  }

  // Update poll options
  updatePollOptions(options, results) {
    const optionsContainer = document.getElementById('pollOptions');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'tp-poll-option';
      optionElement.dataset.optionId = option.id;
      
      optionElement.innerHTML = `
        <span class="tp-option-emoji">${option.emoji}</span>
        <span class="tp-option-text">${option.text}</span>
        <span class="tp-option-vote-count">${results[option.id]?.votes || 0} votes</span>
      `;

      // Add click handler
      optionElement.addEventListener('click', () => {
        this.handleVote(option.id);
      });

      optionsContainer.appendChild(optionElement);
    });
  }

  // Update poll results
  updatePollResults(results, totalVotes) {
    const resultsContainer = document.getElementById('pollResults');
    resultsContainer.innerHTML = '';

    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'tp-results-header';
    resultsHeader.innerHTML = `
      <h4 class="tp-results-title">Results</h4>
      <span class="tp-total-votes">${totalVotes} total votes</span>
    `;
    resultsContainer.appendChild(resultsHeader);

    // Sort results by votes
    const sortedResults = Object.entries(results).sort((a, b) => b[1].votes - a[1].votes);

    sortedResults.forEach(([optionId, result]) => {
      const resultElement = document.createElement('div');
      resultElement.className = 'tp-result-item';
      
      resultElement.innerHTML = `
        <span class="tp-result-emoji">${this.getOptionEmoji(optionId)}</span>
        <span class="tp-result-text">${result.text}</span>
        <div class="tp-result-bar">
          <div class="tp-result-fill" style="width: ${result.percentage}%"></div>
        </div>
        <span class="tp-result-percentage">${result.percentage}%</span>
      `;

      resultsContainer.appendChild(resultElement);
    });
  }

  // Handle vote submission
  async handleVote(optionId) {
    if (this.isVoting) return;
    
    this.isVoting = true;
    
    // Update UI immediately
    const options = document.querySelectorAll('.tp-poll-option');
    options.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.optionId === optionId) {
        option.classList.add('selected');
      }
    });

    try {
      // Submit vote (this would call your API)
      const response = await this.submitVote(this.activePoll.poll.id, optionId);
      
      if (response.success) {
        // Update results
        this.updatePollResults(response.results, response.total_votes);
        
        // Show success message
        this.showVoteSuccess();
      }
    } catch (error) {
      console.error('Vote submission failed:', error);
      this.showVoteError(error.message);
    } finally {
      this.isVoting = false;
    }
  }

  // Update live vote stream
  updateVoteStream(votes) {
    const voteFeed = document.getElementById('voteFeed');
    
    // Remove placeholder
    const placeholder = voteFeed.querySelector('.tp-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Add new votes
    votes.slice(-10).forEach(vote => {
      const voteElement = document.createElement('div');
      voteElement.className = 'tp-vote-item';
      
      const time = new Date(vote.timestamp).toLocaleTimeString();
      
      voteElement.innerHTML = `
        <span class="tp-vote-emoji">${vote.emoji}</span>
        <span class="tp-vote-text">Vote cast: ${vote.option_text}</span>
        <span class="tp-vote-time">${time}</span>
      `;

      voteFeed.appendChild(voteElement);
      
      // Scroll to bottom
      voteFeed.scrollTop = voteFeed.scrollHeight;
    });

    // Keep only last 20 votes
    while (voteFeed.children.length > 20) {
      voteFeed.removeChild(voteFeed.firstChild);
    }
  }

  // Show vote success message
  showVoteSuccess() {
    const message = document.createElement('div');
    message.className = 'tp-vote-success';
    message.innerHTML = '✅ Vote submitted successfully!';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #00C851;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  // Show vote error message
  showVoteError(errorMessage) {
    const message = document.createElement('div');
    message.className = 'tp-vote-error';
    message.innerHTML = `❌ ${errorMessage}`;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #FF4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  // Get option emoji
  getOptionEmoji(optionId) {
    const option = this.activePoll?.poll.options.find(opt => opt.id === optionId);
    return option?.emoji || '📊';
  }

  // Mock vote submission (replace with actual API call)
  async submitVote(pollId, optionId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
      success: true,
      poll_id: pollId,
      option_id: optionId,
      total_votes: (this.activePoll?.total_votes || 0) + 1,
      results: this.activePoll?.results || {}
    };
  }
}

module.exports = PollingUI;
