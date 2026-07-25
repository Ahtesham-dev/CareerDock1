/**
 * Determines if a job matches a user's alert criteria.
 * Adapted to actual JobAlert (keywords string, location string, minSalary, employmentType)
 * and Job (skills array, experience string, salaryMin/Max, type, location) schemas.
 * All checks are AND'd.
 */
function isMatch(job, alert) {
  // Keywords — split by comma, match against title, company, or skills
  const keywords = alert.keywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  if (keywords.length) {
    const keywordMatch = keywords.some(kw =>
      (job.title && job.title.toLowerCase().includes(kw)) ||
      (job.company && job.company.toLowerCase().includes(kw)) ||
      (job.skills && job.skills.some(s => s.toLowerCase().includes(kw)))
    );
    if (!keywordMatch) return false;
  }

  // Location — case-insensitive partial match
  if (alert.location) {
    const alertLoc = alert.location.toLowerCase();
    const jobLoc = (job.location || '').toLowerCase();
    if (!jobLoc.includes(alertLoc) && !alertLoc.includes(jobLoc)) return false;
  }

  // Minimum salary — alert.minSalary is in Lakhs, job.salaryMin/salaryMax are raw numbers
  if (alert.minSalary > 0) {
    const minSalaryRaw = alert.minSalary * 100000;
    if (job.salaryMax < minSalaryRaw) return false;
  }

  // Employment type — exact match
  if (alert.employmentType) {
    if (alert.employmentType !== job.type) return false;
  }

  return true;
}

module.exports = { isMatch };
