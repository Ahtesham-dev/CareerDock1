const { buildJobAlertHtml } = require('../services/email');

describe('Email Service', () => {
  test('buildJobAlertHtml generates valid HTML', () => {
    const jobs = [
      { title: 'React Dev', company: 'TechCo', location: 'Remote', salaryLabel: '₹10-15L', source: 'LinkedIn', externalUrl: 'https://example.com' }
    ];
    const alert = { keywords: 'React', location: 'Remote', minSalary: 10 };
    const html = buildJobAlertHtml(jobs, alert);
    expect(html).toContain('React Dev');
    expect(html).toContain('TechCo');
    expect(html).toContain('CareerDock Job Alert');
  });
});
