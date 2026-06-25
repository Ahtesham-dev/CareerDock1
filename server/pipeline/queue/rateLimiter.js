class RateLimiter {
  constructor(options = {}) {
    this.requestsPerSecond = options.requestsPerSecond || 2;
    this.burstSize = options.burstSize || 5;
    this.tokens = this.burstSize;
    this.lastRefill = Date.now();
    this.waitQueue = [];
  }

  async acquire() {
    this._refill();
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = Math.floor(elapsed * this.requestsPerSecond);
    if (newTokens > 0) {
      this.tokens = Math.min(this.burstSize, this.tokens + newTokens);
      this.lastRefill = now;
      this._drainQueue();
    }
  }

  _drainQueue() {
    while (this.waitQueue.length > 0 && this.tokens > 0) {
      this.tokens--;
      const resolve = this.waitQueue.shift();
      resolve();
    }
  }

  getDelay() {
    this._refill();
    if (this.tokens > 0) return 0;
    const waitTime = (1000 / this.requestsPerSecond) - (Date.now() - this.lastRefill);
    return Math.max(0, waitTime);
  }
}

module.exports = RateLimiter;
