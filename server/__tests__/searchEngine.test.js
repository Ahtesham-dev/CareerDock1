const { buildJobQuery } = require('../controllers/jobAlertController');

describe('Search Engine', () => {
  test('buildJobQuery creates correct MongoDB query', () => {
    const alert = {
      keywords: 'React, Node.js',
      location: 'Remote',
      minSalary: 10,
      employmentType: 'Full-time',
      lastCheckedAt: new Date('2024-01-01')
    };
    const query = buildJobQuery(alert);
    expect(query.postedAt).toBeDefined();
    expect(query.location.$regex).toBeDefined();
    expect(query.salaryMax.$gte).toBe(1000000);
    expect(query.type).toBe('Full-time');
  });

  test('buildJobQuery handles empty optional fields', () => {
    const alert = { keywords: 'Developer', lastCheckedAt: new Date('2024-01-01') };
    const query = buildJobQuery(alert);
    expect(query.postedAt).toBeDefined();
    expect(query.$or).toBeDefined();
  });
});
