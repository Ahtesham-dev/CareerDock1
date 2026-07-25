const { pollNewJobs } = require('./matching/pollNewJobs');

let lastCheck = new Date(0);

const checkAlerts = async () => {
  const since = lastCheck;
  lastCheck = new Date();
  await pollNewJobs(since);
};

module.exports = { checkAlerts };
