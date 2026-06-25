require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://jobiq.vercel.app'
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(requestLogger);

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/saved', require('./routes/saved'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/job-alerts', require('./routes/jobAlerts'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/linkedin', require('./routes/linkedin'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/scraper-runs', require('./routes/scraperRuns'));
app.use('/api/search', require('./routes/search'));
app.use('/api/ats', require('./routes/ats'));
app.use('/api/intelligence', require('./routes/intelligence'));
app.use('/api/engine', require('./routes/engine'));

// Pipeline API routes
app.use('/api/pipeline', require('./pipeline/routes/pipeline'));
app.use('/api/pipeline/jobs', require('./pipeline/routes/jobs'));

app.use(errorLogger);

const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('[Server] MongoDB connection closed');
  } catch (err) {
    console.error('[Server] MongoDB close error:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message);
  gracefulShutdown('uncaughtException');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Start legacy scheduler for backward compat
      try {
        const { startScheduler } = require('./scheduler');
        startScheduler();
      } catch (e) {
        console.log('Legacy scheduler not available:', e.message);
      }
      // Start pipeline scheduler
      try {
        const pipelineScheduler = require('./pipeline/scheduler');
        pipelineScheduler.start();
        console.log('Pipeline scheduler started');
      } catch (e) {
        console.log('Pipeline scheduler not started:', e.message);
      }
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
