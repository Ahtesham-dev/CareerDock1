const EventEmitter = require('events');

class JobQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.retryMax = options.retryMax || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.running = 0;
    this.queue = [];
    this.active = false;
    this.stats = { enqueued: 0, completed: 0, failed: 0, retried: 0 };
  }

  enqueue(task) {
    this.queue.push({
      ...task,
      retries: 0,
      enqueuedAt: Date.now()
    });
    this.stats.enqueued++;
    this._process();
  }

  enqueueBatch(tasks) {
    for (const task of tasks) this.enqueue(task);
  }

  async _process() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    this.running++;
    const task = this.queue.shift();

    try {
      const delay = task.delay || 0;
      if (delay > 0) await new Promise(r => setTimeout(r, delay));

      const result = await this._executeWithRetry(task);
      this.stats.completed++;
      this.emit('completed', { task, result });
    } catch (err) {
      this.stats.failed++;
      this.emit('failed', { task, error: err.message });
    } finally {
      this.running--;
      if (this.queue.length > 0) setImmediate(() => this._process());
    }
  }

  async _executeWithRetry(task) {
    let lastError;
    const maxAttempts = task.retries != null ? task.retries + 1 : this.retryMax;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await task.handler(task.data);
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          this.stats.retried++;
          const delay = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          this.emit('retry', { task, attempt, delay, error: err.message });
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  size() {
    return this.queue.length + this.running;
  }

  getStats() {
    return { ...this.stats, pending: this.queue.length, running: this.running };
  }

  pause() {
    this.active = false;
  }

  resume() {
    this.active = true;
    this._process();
  }
}

module.exports = JobQueue;
