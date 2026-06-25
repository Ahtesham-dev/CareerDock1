const { buildJobQuery } = require('../controllers/jobAlertController');

describe('Job Alert Controller', () => {
  test('buildJobQuery with all fields', () => {
    const alert = {
      keywords: 'React, Node.js',
      location: 'Bangalore',
      minSalary: 5,
      employmentType: 'Remote',
      lastCheckedAt: new Date('2024-06-01')
    };
    const query = buildJobQuery(alert);
    expect(query.type).toBe('Remote');
    expect(query.salaryMax.$gte).toBe(500000);
  });

  test('buildJobQuery with no keywords returns $or', () => {
    const alert = { keywords: 'Engineer', lastCheckedAt: new Date() };
    const query = buildJobQuery(alert);
    expect(query.$or).toBeDefined();
    expect(Array.isArray(query.$or)).toBe(true);
  });
});
