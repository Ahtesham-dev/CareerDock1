const axios = require('axios');
const { URL } = require('url');

class UrlValidationService {
  constructor() {
    this.http = axios.create({
      timeout: 8000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      validateStatus: status => status < 400
    });
    this.stats = { checked: 0, valid: 0, invalid: 0, error: 0 };
  }

  async validate(url) {
    this.stats.checked++;
    if (!url || typeof url !== 'string') {
      this.stats.invalid++;
      return { status: 'invalid', reason: 'empty' };
    }
    try {
      new URL(url);
    } catch {
      this.stats.invalid++;
      return { status: 'invalid', reason: 'bad_url' };
    }
    if (!url.startsWith('http')) {
      this.stats.invalid++;
      return { status: 'invalid', reason: 'no_protocol' };
    }
    try {
      const response = await this.http.head(url);
      this.stats.valid++;
      return { status: 'valid', statusCode: response.status };
    } catch (headErr) {
      try {
        const response = await this.http.get(url, { maxContentLength: 1024 * 10 });
        this.stats.valid++;
        return { status: 'valid', statusCode: response.status };
      } catch (getErr) {
        if (getErr.response && getErr.response.status < 400) {
          this.stats.valid++;
          return { status: 'valid', statusCode: getErr.response.status };
        }
        this.stats.invalid++;
        return { status: 'invalid', reason: `http_${getErr.response?.status || 'error'}`, statusCode: getErr.response?.status };
      }
    }
  }

  async validateBatch(jobs, batchSize = 5) {
    const results = [];
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(job => this.validate(job.applyUrl || job.externalUrl || '').then(result => ({ job, result })))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') results.push(r.value);
        else {
          this.stats.error++;
          results.push({ job: batch[batchResults.indexOf(r)], result: { status: 'error', reason: r.reason?.message || 'unknown' } });
        }
      }
      if (i + batchSize < jobs.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    return results;
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { checked: 0, valid: 0, invalid: 0, error: 0 };
  }
}

module.exports = new UrlValidationService();
