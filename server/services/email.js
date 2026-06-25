const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const buildJobAlertHtml = (jobs, alert) => {
  const jobRows = jobs.map(j => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee">
        <strong>${j.title}</strong> at ${j.company}
        <div style="color:#666;font-size:13px;margin-top:4px">
          ${j.location} | ${j.salaryLabel || 'Salary not disclosed'} | ${j.source}
        </div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">
        <a href="${j.externalUrl || '#'}" style="background:#6366f1;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">View Job</a>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;margin:0 0 8px">CareerDock Job Alert</h1>
      <p style="color:#666;margin:0 0 24px">New jobs matching your criteria</p>
      <div style="background:#f5f3ff;border-radius:8px;padding:16px;margin-bottom:24px">
        <strong>Alert Criteria:</strong>
        <div style="margin-top:4px;color:#555">
          Keywords: ${alert.keywords}${alert.location ? ` | Location: ${alert.location}` : ''}${alert.minSalary ? ` | Min Salary: ₹${alert.minSalary}L` : ''}
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse">${jobRows}</table>
      <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">
        CareerDock — Your job discovery platform
      </p>
    </div>
  `;
};

const sendJobAlert = async (email, jobs, alert) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Email not configured. Would send ${jobs.length} job alerts to ${email}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'CareerDock <noreply@careerdock.app>',
      to: email,
      subject: `CareerDock Alert: ${jobs.length} new jobs found`,
      html: buildJobAlertHtml(jobs, alert)
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

module.exports = { transporter, sendJobAlert, buildJobAlertHtml };
