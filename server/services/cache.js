const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.defaultTTL = 300;
    this.memoryCache = new Map();
    this.memoryMode = true;
  }

  async connect(url = 'redis://localhost:6379') {
    try {
      this.client = redis.createClient({ url });
      this.client.on('error', () => { this.connected = false; });
      await this.client.connect();
      this.connected = true;
      this.memoryMode = false;
      console.log('[Cache] Connected to Redis');
    } catch {
      console.log('[Cache] Redis unavailable — using in-memory cache');
      this.memoryMode = true;
    }
  }

  async get(key) {
    if (this.memoryMode) return this.memoryCache.get(key) || null;
    try {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (this.memoryMode) {
      this.memoryCache.set(key, value);
      if (ttl > 0) setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
      return;
    }
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch {}
  }

  async del(key) {
    if (this.memoryMode) { this.memoryCache.delete(key); return; }
    try { await this.client.del(key); } catch {}
  }

  async flush() {
    this.memoryCache.clear();
    if (this.connected) try { await this.client.flushDb(); } catch {}
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) return cached;
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  generateKey(prefix, params = {}) {
    const sorted = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
    return `${prefix}:${sorted}`;
  }
}

module.exports = new CacheService();
