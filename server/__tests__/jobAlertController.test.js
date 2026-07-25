const { isMatch } = require('../services/matching/isMatch');

describe('Job Alert Matching', () => {
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

    test('matches on title keyword', () => {
      expect(isMatch(baseJob, baseAlert)).toBe(true);
    });

    test('rejects when keyword not found', () => {
      expect(isMatch(baseJob, { ...baseAlert, keywords: 'Python' })).toBe(false);
    });

    test('rejects on location mismatch', () => {
      expect(isMatch(baseJob, { ...baseAlert, location: 'Mumbai' })).toBe(false);
    });

    test('rejects on salary below minimum', () => {
      expect(isMatch({ ...baseJob, salaryMax: 300000 }, baseAlert)).toBe(false);
    });

    test('rejects on employment type mismatch', () => {
      expect(isMatch(baseJob, { ...baseAlert, employmentType: 'Remote' })).toBe(false);
    });
  });
});
