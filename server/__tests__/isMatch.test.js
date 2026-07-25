const { isMatch } = require('../services/matching/isMatch');

describe('isMatch', () => {
  const baseJob = {
    title: 'Senior React Developer',
    company: 'TechCorp',
    skills: ['React', 'Node.js', 'TypeScript'],
    experience: 'Senior',
    salaryMin: 1200000,
    salaryMax: 2400000,
    location: 'Bangalore',
    type: 'Full-time',
  };

  const baseAlert = {
    keywords: 'React, Developer',
    location: 'Bangalore',
    minSalary: 5,
    employmentType: 'Full-time',
    isActive: true,
  };

  test('returns true when all criteria match', () => {
    expect(isMatch(baseJob, baseAlert)).toBe(true);
  });

  test('returns false when keywords do not match title, company, or skills', () => {
    const alert = { ...baseAlert, keywords: 'Python, Django' };
    expect(isMatch(baseJob, alert)).toBe(false);
  });

  test('matches keyword against company name', () => {
    const alert = { ...baseAlert, keywords: 'TechCorp' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('matches keyword against skill', () => {
    const alert = { ...baseAlert, keywords: 'TypeScript' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('returns false when location does not match', () => {
    const alert = { ...baseAlert, location: 'Mumbai' };
    expect(isMatch(baseJob, alert)).toBe(false);
  });

  test('returns true when location is partially matching', () => {
    const alert = { ...baseAlert, location: 'Ban' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('returns false when salary is below minimum', () => {
    const alert = { ...baseAlert, minSalary: 50 };
    const job = { ...baseJob, salaryMax: 500000 };
    expect(isMatch(job, alert)).toBe(false);
  });

  test('returns true when salary meets minimum', () => {
    const alert = { ...baseAlert, minSalary: 12 };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('returns false when employment type does not match', () => {
    const alert = { ...baseAlert, employmentType: 'Remote' };
    expect(isMatch(baseJob, alert)).toBe(false);
  });

  test('skips keyword check when alert has no keywords', () => {
    const alert = { ...baseAlert, keywords: '' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('skips location check when alert location is empty', () => {
    const alert = { ...baseAlert, location: '' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('skips salary check when minSalary is 0', () => {
    const alert = { ...baseAlert, minSalary: 0 };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('skips employment type check when employmentType is empty', () => {
    const alert = { ...baseAlert, employmentType: '' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('is case-insensitive for keywords', () => {
    const alert = { ...baseAlert, keywords: 'react developer' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });

  test('is case-insensitive for location', () => {
    const alert = { ...baseAlert, location: 'bangalore' };
    expect(isMatch(baseJob, alert)).toBe(true);
  });
});
