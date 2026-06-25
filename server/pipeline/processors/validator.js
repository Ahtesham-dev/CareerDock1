const PipelineLogger = require('../monitoring/logger');

class JobValidator {
  constructor() {
    this.logger = new PipelineLogger({ source: 'processor:validator' });
  }

  validate(job) {
    const errors = [];
    const warnings = [];

    if (!job.title || job.title.trim().length < 3) {
      errors.push('Missing or invalid title');
    }

    if (!job.company || job.company.trim().length < 2) {
      errors.push('Missing or invalid company');
    }

    if (!job.applyUrl || !this._isValidUrl(job.applyUrl)) {
      errors.push('Missing or invalid apply URL');
    }

    if (!job.description || job.description.trim().length < 50) {
      warnings.push('Description too short or missing');
    }

    if (job.skills && job.skills.length > 30) {
      warnings.push('Unusually high number of skills');
    }

    if (this._isSpam(job)) {
      errors.push('Content flagged as spam');
    }

    if (this._checkTitleQuality(job.title)) {
      warnings.push('Title may be low quality');
    }

    if (job.salaryMin && job.salaryMax && job.salaryMin > job.salaryMax) {
      warnings.push('Salary min exceeds max');
    }

    if (job.sourceJobId && job.sourceJobId.length > 100) {
      warnings.push('Unusually long source job ID');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: this._computeScore(errors, warnings)
    };
  }

  _isValidUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  _isSpam(job) {
    const text = [
      job.title || '',
      job.company || '',
      job.description || '',
      ...(job.skills || [])
    ].join(' ').toLowerCase();

    const spamPatterns = [
      'work from home', 'make money', 'earn', 'data entry', 'copy paste',
      'part time', 'flexible hours', 'no experience needed', 'no skills',
      'easy money', 'quick cash', 'instant approval', 'guaranteed',
      '$$$', 'sign up bonus', 'referral bonus'
    ];

    let spamScore = 0;
    for (const pattern of spamPatterns) {
      if (text.includes(pattern)) spamScore++;
    }

    const allCapsRatio = (job.title || '').split('').filter(c => c >= 'A' && c <= 'Z').length / Math.max((job.title || '').length, 1);
    if (allCapsRatio > 0.7 && job.title.length > 5) spamScore += 2;

    return spamScore >= 3;
  }

  _checkTitleQuality(title) {
    const t = title.toLowerCase().trim();
    const badPatterns = ['urgent', 'immediate', 'requirement', 'opening', 'hiring', 'vacancy', 'need'];
    return badPatterns.some(p => t.includes(p));
  }

  _computeScore(errors, warnings) {
    let score = 100;
    score -= errors.length * 25;
    score -= warnings.length * 10;
    return Math.max(0, score);
  }
}

module.exports = new JobValidator();
