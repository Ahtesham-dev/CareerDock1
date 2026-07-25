const JobAlert = require('../../models/JobAlert');
const MatchLog = require('../../models/MatchLog');
const User = require('../../models/User');
const { isMatch } = require('./isMatch');
const { sendJobAlert } = require('../email');

/**
 * Core matching function. Takes newly created/updated jobs and runs them
 * against all active alerts. Sends email notifications for matches.
 * Input-agnostic — call it from a cron poll or a change stream trigger.
 * @param {Array} newJobs - array of job docs
 */
async function runMatching(newJobs) {
  const activeAlerts = await JobAlert.find({ isActive: true }).lean();
  if (!activeAlerts.length) return;

  const matchLogOps = [];
  const emailJobs = [];

  for (const job of newJobs) {
    for (const alert of activeAlerts) {
      if (!isMatch(job, alert)) continue;

      const alreadyMatched = await MatchLog.exists({
        userId: alert.userId,
        jobId: job._id,
        alertId: alert._id,
      });
      if (alreadyMatched) continue;

      matchLogOps.push({
        insertOne: {
          document: {
            userId: alert.userId,
            jobId: job._id,
            alertId: alert._id,
            matchedAt: new Date(),
            emailStatus: 'pending',
          },
        },
      });

      emailJobs.push({ userId: alert.userId, jobId: job._id, alertId: alert._id });
    }
  }

  if (matchLogOps.length) {
    await MatchLog.bulkWrite(matchLogOps);
  }

  // Send emails — decoupled so a slow SMTP call never blocks matching
  for (const item of emailJobs) {
    try {
      const [user, jobDoc] = await Promise.all([
        User.findById(item.userId).lean(),
        require('../../models/Job').findById(item.jobId).lean(),
      ]);

      if (!user || !jobDoc) {
        await MatchLog.updateOne(
          { userId: item.userId, jobId: item.jobId, alertId: item.alertId },
          { emailStatus: 'failed', emailSentAt: new Date() }
        );
        continue;
      }

      const alert = activeAlerts.find(a => a._id.toString() === item.alertId.toString());
      if (!alert) continue;

      await sendJobAlert(user.email, [jobDoc], alert);
      await MatchLog.updateOne(
        { userId: item.userId, jobId: item.jobId, alertId: item.alertId },
        { emailStatus: 'sent', emailSentAt: new Date() }
      );
    } catch (err) {
      console.error('[runMatching] email send failed:', err.message);
      await MatchLog.updateOne(
        { userId: item.userId, jobId: item.jobId, alertId: item.alertId },
        { emailStatus: 'failed', emailSentAt: new Date() }
      );
    }
  }
}

module.exports = { runMatching };
