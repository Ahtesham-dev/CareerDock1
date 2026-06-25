const BaseScraper = require('./baseScraper');
const launchBrowser = require('./launchBrowser');

const URLS = [
  'https://www.naukri.com/frontend-developer-jobs',
  'https://www.naukri.com/backend-developer-jobs',
  'https://www.naukri.com/full-stack-developer-jobs',
  'https://www.naukri.com/data-scientist-jobs',
  'https://www.naukri.com/devops-engineer-jobs'
];

class NaukriScraper extends BaseScraper {
  constructor() {
    super('Naukri');
  }

  async fetchJobs() {
    const browser = await launchBrowser();
    if (!browser) return [];
    const jobs = [];
    try {
      for (const url of URLS) {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.setRequestInterception(true);
        page.on('request', req => {
          if (['image', 'font', 'media', 'stylesheet'].includes(req.resourceType())) req.abort();
          else req.continue();
        });
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
          await new Promise(r => setTimeout(r, 4000));
          const data = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/json"]');
            for (const s of scripts) {
              try {
                const parsed = JSON.parse(s.textContent);
                if (parsed?.jobList?.length) return parsed.jobList;
              } catch { }
            }
            const items = [];
            document.querySelectorAll('.jobTuple, .job-card, [class*="job"]').forEach(el => {
              const title = el.querySelector('[class*="title"]')?.textContent?.trim();
              const company = el.querySelector('[class*="company"]')?.textContent?.trim();
              if (title) items.push({ title, company });
            });
            return items;
          });
          (data || []).forEach(j => {
            if (j.title && j.company) {
              jobs.push({
                title: j.title,
                company: j.company,
                location: j.location || 'India',
                salaryMin: j.salaryMin || 0,
                salaryMax: j.salaryMax || 0,
                skills: (j.skills || []).map(s => typeof s === 'string' ? s : s.label || ''),
                postedAt: j.postedAt ? new Date(j.postedAt) : new Date(),
                externalUrl: j.url || url
              });
            }
          });
        } catch (err) {
          console.warn(`[Naukri] Failed to fetch ${url}: ${err.message}`);
        }
        await page.close();
      }
    } finally {
      await browser.close();
    }
    return jobs;
  }
}

module.exports = NaukriScraper;
