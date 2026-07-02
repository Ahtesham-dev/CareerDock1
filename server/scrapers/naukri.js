const BaseScraper = require('./baseScraper');
const launchBrowser = require('./launchBrowser');

const URLS = [
  { keyword: 'frontend developer', seoKey: 'frontend-developer-jobs' },
  { keyword: 'backend developer', seoKey: 'backend-developer-jobs' },
  { keyword: 'full stack developer', seoKey: 'full-stack-developer-jobs' },
  { keyword: 'data scientist', seoKey: 'data-scientist-jobs' },
  { keyword: 'devops engineer', seoKey: 'devops-engineer-jobs' }
];

class NaukriScraper extends BaseScraper {
  constructor() {
    super('Naukri');
  }

  async fetchJobs() {
    let browser;
    try {
      browser = await launchBrowser();
    } catch (err) {
      console.error(`[Naukri] Browser unavailable: ${err.message}`);
      return [];
    }
    const jobs = [];
    const seen = new Set();

    try {
      for (const { keyword, seoKey } of URLS) {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

        const apiPromise = new Promise(resolve => {
          page.on('response', async res => {
            if (res.url().includes('/jobapi/v3/search')) {
              try {
                const data = await res.json();
                resolve(data?.jobDetails || []);
              } catch { resolve([]); }
            }
          });
          setTimeout(() => resolve([]), 20000);
        });

        try {
          await page.goto(`https://www.naukri.com/${seoKey}`, { waitUntil: 'networkidle2', timeout: 45000 });
          const apiJobs = await apiPromise;

          for (const j of apiJobs) {
            const dedupKey = `${j.title}|${j.companyName}`;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            jobs.push({
              title: j.title || '',
              company: j.companyName || '',
              location: (j.placeholders || []).join(', ') || 'India',
              salaryMin: parseInt(j.salaryDetail?.min) || 0,
              salaryMax: parseInt(j.salaryDetail?.max) || 0,
              skills: (j.tagsAndSkills || []).map(s => typeof s === 'string' ? s : s.label || s.text || ''),
              postedAt: j.createdDate ? new Date(j.createdDate) : new Date(),
              externalUrl: j.url || `https://www.naukri.com${j.jobDetailsUrl || ''}`,
              applyUrl: j.url || `https://www.naukri.com${j.jobDetailsUrl || ''}`
            });
          }
        } catch (err) {
          console.warn(`[Naukri] Failed ${keyword}: ${err.message}`);
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
