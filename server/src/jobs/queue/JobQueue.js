const pipelineQueue = require('../../../pipeline/queue');

class JobQueue {
  constructor(options = {}) {
    this.queue = new (require('../../../pipeline/queue'))(options);
  }

  enqueue(task) { this.queue.enqueue(task); }
  enqueueBatch(tasks) { this.queue.enqueueBatch(tasks); }
  size() { return this.queue.size(); }
  getStats() { return this.queue.getStats(); }
  on(event, handler) { this.queue.on(event, handler); }
}

module.exports = JobQueue;
