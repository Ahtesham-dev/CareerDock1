import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import TopNav from '../layout/TopNav';
import Badge from '../components/ui/Badge';
import { StatSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { insightsAPI, applicationsAPI } from '../api';

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function DonutChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="card-premium p-5">
      <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {data.reduce((acc, d, i) => {
          const pct = d.count / total;
          const startAngle = acc; const endAngle = acc + pct * 360;
          const sx = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
          const sy = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
          const ex = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
          const ey = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
          const largeArc = pct > 0.5 ? 1 : 0; acc += pct * 360;
          return <path key={i} d={`M 100 100 L ${sx} ${sy} A 80 80 0 ${largeArc} 1 ${ex} ${ey} Z`} fill={COLORS[i % COLORS.length]} stroke="#1A1A1A" strokeWidth="2" />;
        }, 0)}
        <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-white">{total}</text>
        <text x="100" y="115" textAnchor="middle" className="text-xs fill-gray-400">Total</text>
      </svg>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-text-muted">{d._id}: {d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Insights() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([insightsAPI.getInsights(), applicationsAPI.getApplications()])
      .then(([insights, apps]) => setStats({ ...insights.data, apps: apps.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div><TopNav title="Insights" subtitle="Market analytics" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <StatSkeleton key={i} />)}</div>
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map(i => <ChartSkeleton key={i} />)}</div>
      </div>
    </div>
  );
  if (!stats) return <div className="p-6 text-text-muted">Failed to load insights.</div>;

  return (
    <div>
      <TopNav title="Insights" subtitle="Live market analytics" />
      <div className="p-4 lg:p-6 space-y-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Jobs', value: stats.totalJobs?.toLocaleString() || 0, color: 'text-accent-light' },
            { label: 'Avg Salary', value: `₹${Math.round((stats.avgSalary || 0) / 100000)}L`, color: 'text-success' },
            { label: 'Remote %', value: `${stats.remotePercent || 0}%`, color: 'text-accent-light' },
            { label: 'With Salary', value: stats.totalJobsWithSalary?.toLocaleString() || 0, color: 'text-warning' }
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-premium p-5">
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-premium p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Jobs by Platform</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(stats.byPlatform || []).slice(0, 8)}>
                <XAxis dataKey="_id" tick={{ fill: '#7A7A7A', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#7A7A7A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <DonutChart data={stats.byType || []} title="Job Types" />

          <div className="card-premium p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Top Skills in Demand</h3>
            <div className="space-y-3">
              {(stats.topSkills || []).slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-5 font-medium">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{s._id}</span>
                      <span className="text-text-muted text-xs">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.count / (stats.topSkills[0]?.count || 1)) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full" transition={{ duration: 0.8, delay: i * 0.05 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Top Locations</h3>
            <div className="space-y-2">
              {(stats.topLocations || []).slice(0, 8).map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <i className="ti ti-map-pin text-text-muted text-sm" />
                    <span className="text-sm text-text-secondary">{l._id}</span>
                  </div>
                  <span className="text-xs text-text-muted font-medium">{l.count} jobs</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
