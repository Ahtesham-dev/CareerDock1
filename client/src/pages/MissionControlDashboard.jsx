import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import TopNav from '../layout/TopNav';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { StatSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { insightsAPI, jobsAPI, savedAPI } from '../api';
import Logo from '../components/Logo';

export default function MissionControlDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    Promise.all([
      insightsAPI.getInsights(),
      savedAPI.getSaved(),
      jobsAPI.getJobs({ limit: 5, sort: 'newest' })
    ])
      .then(([ins, saved, jobs]) => {
        setInsights(ins.data);
        setSavedCount(saved.data.length);
        setRecentJobs(jobs.data.jobs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <TopNav title={<><Logo size={32} /><i className="ti ti-chart-ppie text-lg" /> STATISTICS</>} subtitle="Real-time analytics" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <StatSkeleton key={i} />)}</div>
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map(i => <ChartSkeleton key={i} />)}</div>
      </div>
    </div>
  );

  const statsCards = [
    { label: 'Live Jobs', value: insights?.totalJobs?.toLocaleString() || 0, icon: 'briefcase', color: 'text-accent-light', bg: 'bg-accent/10' },
    { label: 'Saved Jobs', value: savedCount, icon: 'bookmark', color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Avg Salary', value: `₹${Math.round((insights?.avgSalary || 0) / 100000)}L`, icon: 'coin', color: 'text-success', bg: 'bg-success/10' },
    { label: 'Remote Jobs', value: insights?.remotePercent || 0, suffix: '%', icon: 'world', color: 'text-accent-light', bg: 'bg-accent/10' },
  ];

  return (
    <div>
      <TopNav title={<><Logo size={32} /><i className="ti ti-chart-ppie text-lg" /> STATISTICS</>} subtitle="Real-time analytics" />
      <div className="p-4 lg:p-6 space-y-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-premium p-5 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full ${s.bg} opacity-50`} />
              <i className={`ti ti-${s.icon} text-lg mb-2 block text-text-muted`} />
              <p className="text-2xl font-bold text-text-primary">{s.value}{s.suffix || ''}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-premium p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Jobs by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(insights?.byPlatform || []).slice(0, 8)}>
                <XAxis dataKey="_id" tick={{ fill: '#7A7A7A', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#7A7A7A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-premium p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Top Skills in Demand</h3>
            <div className="space-y-3">
              {(insights?.topSkills || []).slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-4 font-medium">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{s._id}</span>
                      <span className="text-text-muted text-xs">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.count / (insights?.topSkills[0]?.count || 1)) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full" transition={{ duration: 0.8, delay: i * 0.05 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary">Latest Jobs</h3>
            <Badge color="indigo">{recentJobs.length} new</Badge>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentJobs.map((job, i) => (
              <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{job.title}</p>
                  <p className="text-xs text-text-muted">{job.company} &middot; {job.location}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.salaryLabel && <span className="text-xs text-success font-medium">{job.salaryLabel}</span>}
                  <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-text-muted uppercase">{job.source}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
