const fs = require('fs');

class BrowserUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BrowserUnavailableError';
  }
}

function _resolveExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const p = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fs.existsSync(p)) return p;
    throw new BrowserUnavailableError(
      `PUPPETEER_EXECUTABLE_PATH="${p}" does not exist`
    );
  }

  if (process.env.CHROME_PATH) {
    const p = process.env.CHROME_PATH;
    if (fs.existsSync(p)) return p;
    throw new BrowserUnavailableError(
      `CHROME_PATH="${p}" does not exist`
    );
  }

  try {
    const puppeteer = require('puppeteer');
    const p = puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
  } catch (e) {
    throw new BrowserUnavailableError(
      'Puppeteer package not available: ' + e.message
    );
  }

  throw new BrowserUnavailableError(
    'No Chromium browser found. Set PUPPETEER_EXECUTABLE_PATH or CHROME_PATH, or install puppeteer.'
  );
}

async function launchBrowser() {
  const executablePath = _resolveExecutablePath();
  let puppeteer;
  try {
    puppeteer = require('puppeteer-core');
  } catch {
    try {
      puppeteer = require('puppeteer');
    } catch {
      throw new BrowserUnavailableError('Neither puppeteer-core nor puppeteer is installed');
    }
  }

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--ignore-certificate-errors'
  ];

  try {
    const browser = await puppeteer.launch({ executablePath, headless: 'new', args });
    return browser;
  } catch (err) {
    throw new BrowserUnavailableError(
      `Failed to launch Chromium at "${executablePath}": ${err.message}`
    );
  }
}

module.exports = { launchBrowser, BrowserUnavailableError };
