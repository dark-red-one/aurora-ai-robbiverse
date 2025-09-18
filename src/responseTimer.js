// Response Timer - Real speed metrics for every response
class ResponseTimer {
  constructor() {
    this.startTime = null;
    this.firstTokenTime = null;
    this.completeTime = null;
    this.response = '';
  }

  start() {
    this.startTime = process.hrtime.bigint();
    return this;
  }

  firstToken() {
    if (!this.firstTokenTime) {
      this.firstTokenTime = process.hrtime.bigint();
    }
  }

  complete() {
    this.completeTime = process.hrtime.bigint();
    return this.getMetrics();
  }

  getMetrics() {
    if (!this.startTime || !this.completeTime) return null;
    
    const totalMs = Number(this.completeTime - this.startTime) / 1_000_000;
    const firstTokenMs = this.firstTokenTime ? 
      Number(this.firstTokenTime - this.startTime) / 1_000_000 : totalMs;
    
    // Speed thresholds for RTX 4090
    const speed = totalMs < 250 ? '🟢' : totalMs < 700 ? '🟡' : '🔴';
    const status = totalMs < 250 ? 'FAST' : totalMs < 700 ? 'OK' : 'SLOW';
    
    return {
      total: Math.round(totalMs),
      firstToken: Math.round(firstTokenMs),
      speed,
      status,
      display: `[${speed} ${totalMs.toFixed(0)}ms total, ${firstTokenMs.toFixed(0)}ms first token - ${status}]`
    };
  }
}

// Global timer instance
const timer = new ResponseTimer();

export default ResponseTimer;
export { timer };

export function metricsSuffix(metrics) {
  if (!metrics) return '';
  const gyy = metrics.speed === '🟢' ? 'G' : metrics.speed === '🟡' ? 'Y' : 'R';
  return ` [${metrics.firstToken}ms|${metrics.total}ms|${gyy}]`;
}

