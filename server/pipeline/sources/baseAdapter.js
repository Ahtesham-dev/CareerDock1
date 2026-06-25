const axios = require('axios');
const PipelineLogger = require('../monitoring/logger');

class SourceAdapter {
  constructor(name) {
    this.name = name;
    this.logger = new PipelineLogger({ source: `adapter:${name}` });
    this.http = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
  }

  async discover() {
    throw new Error(`${this.name} must implement discover()`);
  }

  async fetchJobs(context) {
    throw new Error(`${this.name} must implement fetchJobs()`);
  }

  normalize(raw) {
    return raw;
  }

  async run(context) {
    const start = Date.now();
    try {
      const jobs = await this._retry(() => this.fetchJobs(context));
      const normalized = jobs.map(j => this.normalize(j)).filter(Boolean);
      this.logger.info(`Fetched ${normalized.length} jobs from ${this.name}`);
      return {
        success: true,
        jobs: normalized,
        found: jobs.length,
        saved: normalized.length,
        duration: Date.now() - start
      };
    } catch (err) {
      this.logger.error(`Failed to fetch from ${this.name}: ${err.message}`);
      return {
        success: false,
        jobs: [],
        found: 0,
        saved: 0,
        duration: Date.now() - start,
        error: err.message
      };
    }
  }

  async _retry(fn, retries = 3, baseDelay = 2000) {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 2000;
          this.logger.warn(`Retry ${attempt}/${retries} for ${this.name} after ${Math.round(delay)}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastErr;
  }

  async _fetch(url, options = {}) {
    const response = await this.http.get(url, {
      responseType: options.json === false ? 'text' : 'json',
      timeout: options.timeout || 30000,
      headers: { ...this.http.defaults.headers, ...options.headers }
    });
    return response.data;
  }

  _extractJsonLd($) {
    const results = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting' || item['@type'] === 'ItemList') {
            results.push(item);
          }
        }
      } catch { }
    });
    return results;
  }
}

module.exports = SourceAdapter;
