const axios = require('axios');
const { CompanyRegistry } = require('../../models');
const PipelineLogger = require('../../monitoring/logger');

const YC_OSS_API = 'https://yc-oss.github.io/api';
const YC_ALL_COMPANIES = `${YC_OSS_API}/companies/all.json`;
const YC_HIRING_COMPANIES = `${YC_OSS_API}/companies/hiring.json`;

class YCCompanyRegistry {
  constructor() {
    this.logger = new PipelineLogger({ source: 'yc:registry' });
    this.http = axios.create({
      timeout: 60000,
      headers: { 'User-Agent': 'CareerDock/1.0', 'Accept': 'application/json' }
    });
  }

  async discoverAll() {
    this.logger.info('Starting YC company discovery via yc-oss API');
    try {
      const { data: allCompanies } = await this.http.get(YC_ALL_COMPANIES);
      const companies = Array.isArray(allCompanies) ? allCompanies : [];

      let hiringSet = new Set();
      try {
        const { data: hiringCompanies } = await this.http.get(YC_HIRING_COMPANIES);
        if (Array.isArray(hiringCompanies)) {
          hiringSet = new Set(hiringCompanies.map(c => c.name || c.id || c.slug));
        }
      } catch (err) {
        this.logger.warn(`Could not fetch hiring companies: ${err.message}`);
      }

      const mapped = companies.map(c => ({
        name: c.name || '',
        normalizedName: (c.name || '').toLowerCase().trim(),
        website: c.website || '',
        careersUrl: this._buildCareersUrl(c),
        careersPlatform: this._detectPlatform(c),
        industry: c.one_liner || c.description || '',
        batch: c.batch || '',
        description: c.one_liner || c.description || '',
        logo: c.logo || c.thumbnail || '',
        ycUrl: `https://www.ycombinator.com/companies/${c.slug || (c.name || '').toLowerCase().replace(/\s+/g, '-')}`,
        tags: c.tags || [],
        active: hiringSet.has(c.name) || hiringSet.has(c.slug) || true
      }));

      this.logger.info(`Total YC companies discovered: ${mapped.length} (${hiringSet.size} hiring)`);
      return mapped;
    } catch (err) {
      this.logger.error(`YC OSS API failed: ${err.message}, trying fallback...`);
      return this._fallbackFetch();
    }
  }

  async _fallbackFetch() {
    this.logger.info('Using fallback YC company fetch');
    const companies = [];
    try {
      const cheerio = require('cheerio');
      const { data: html } = await axios.get('https://www.ycombinator.com/companies', {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(html);
      $('a[href*="/companies/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.includes('?') || href === '/companies') return;
        const name = $(el).text().trim() || href.split('/').pop();
        if (name.length < 2) return;
        companies.push({
          name,
          normalizedName: name.toLowerCase(),
          website: '',
          careersUrl: '',
          industry: '',
          batch: '',
          description: '',
          logo: '',
          ycUrl: `https://www.ycombinator.com${href}`,
          tags: [],
          active: true
        });
      });
      this.logger.info(`Fallback found ${companies.length} companies`);
    } catch (err) {
      this.logger.error(`Fallback fetch failed: ${err.message}`);
    }
    return [...new Map(companies.map(c => [c.name, c])).values()];
  }

  _buildCareersUrl(company) {
    if (company.careers_url || company.careersUrl) return company.careers_url || company.careersUrl;
    if (!company.website) return '';
    try {
      const domain = company.website.startsWith('http') ? new URL(company.website).hostname : company.website;
      return `https://${domain}/careers`;
    } catch {
      return '';
    }
  }

  _detectPlatform(company) {
    const url = company.careers_url || company.careersUrl || company.website || '';
    const u = url.toLowerCase();
    if (u.includes('greenhouse')) return 'greenhouse';
    if (u.includes('lever')) return 'lever';
    if (u.includes('ashby')) return 'ashby';
    if (u.includes('workable')) return 'workable';
    if (u.includes('teamtailor')) return 'teamtailor';
    if (u.includes('breezy')) return 'breezy';
    if (u.includes('recruitee')) return 'recruitee';
    if (u.includes('smartrecruiters')) return 'smartrecruiters';
    if (u.includes('bamboo')) return 'bamboohr';
    if (u.includes('pinpointhq')) return 'pinpoint';
    return 'direct';
  }

  async syncToDatabase(companies) {
    let added = 0, updated = 0;
    for (const c of companies) {
      try {
        const result = await CompanyRegistry.findOneAndUpdate(
          { name: c.name },
          { $set: c, $setOnInsert: { createdAt: new Date() } },
          { upsert: true, new: true }
        );
        if (result.createdAt && result.createdAt.getTime() === result.updatedAt?.getTime()) added++;
        else updated++;
      } catch (err) {
        this.logger.error(`Failed to sync company ${c.name}: ${err.message}`);
      }
    }
    this.logger.info(`Synced ${companies.length} companies (${added} new, ${updated} updated)`);
    return { added, updated };
  }

  async refresh() {
    const companies = await this.discoverAll();
    const result = await this.syncToDatabase(companies);
    return { ...result, total: companies.length };
  }
}

module.exports = YCCompanyRegistry;
