const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class PipelineLogger {
  constructor(options = {}) {
    this.level = LEVELS[options.level] || LEVELS.INFO;
    this.source = options.source || 'pipeline';
    this.logs = [];
    this.maxLogs = options.maxLogs || 10000;
  }

  debug(msg, data) { this._log('DEBUG', msg, data); }
  info(msg, data) { this._log('INFO', msg, data); }
  warn(msg, data) { this._log('WARN', msg, data); }
  error(msg, data) { this._log('ERROR', msg, data); }

  _log(level, msg, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      message: msg,
      data: data || {}
    };

    if (this.logs.length >= this.maxLogs) this.logs.shift();
    this.logs.push(entry);

    if (LEVELS[level] >= this.level) {
      const prefix = `[${entry.timestamp}] [${level}] [${this.source}]`;
      if (data && Object.keys(data).length > 0) {
        console.log(`${prefix} ${msg}`, JSON.stringify(data));
      } else {
        console.log(`${prefix} ${msg}`);
      }
    }
  }

  getRecent(count = 100) {
    return this.logs.slice(-count);
  }

  getErrors(count = 50) {
    return this.logs.filter(l => l.level === 'ERROR').slice(-count);
  }

  getStats() {
    const stats = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const log of this.logs) stats[log.level.toLowerCase()]++;
    return stats;
  }

  child(source) {
    return new PipelineLogger({ level: Object.keys(LEVELS).find(k => LEVELS[k] === this.level), source, maxLogs: this.maxLogs });
  }
}

module.exports = PipelineLogger;
