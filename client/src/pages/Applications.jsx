import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Badge from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { applicationsAPI } from '../api';

const statusColors = { Saved: 'gray', Applied: 'blue', Interview: 'amber', Offer: 'green', Rejected: 'red' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    applicationsAPI.getApplications()
      .then(res => setApps(res.data))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try { await applicationsAPI.update(id, { status }); setApps(prev => prev.map(a => a._id === id ? { ...a, status } : a)); } catch {}
  };
  const handleDelete = async (id) => {
    try { await applicationsAPI.remove(id); setApps(prev => prev.filter(a => a._id !== id)); } catch {}
  };

  return (
    <div>
      <TopNav title="Applications" subtitle="Track every job you have applied to" />
      <div className="p-4 lg:p-6">
        {error && <div className="card-premium p-4 text-error text-sm mb-4"><i className="ti ti-alert-circle" /> {error}</div>}
        {loading ? <TableSkeleton rows={6} /> : apps.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <i className="ti ti-clipboard-list text-4xl text-text-muted mb-3 block" />
            <p className="text-text-secondary text-sm">No applications yet. Start applying to jobs!</p>
          </div>
        ) : (
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left py-3.5 px-4 font-medium">Company</th>
                    <th className="text-left py-3.5 px-4 font-medium">Role</th>
                    <th className="text-left py-3.5 px-4 font-medium">Status</th>
                    <th className="text-left py-3.5 px-4 font-medium">Source</th>
                    <th className="text-left py-3.5 px-4 font-medium">Applied</th>
                    <th className="text-left py-3.5 px-4 font-medium hidden md:table-cell">Notes</th>
                    <th className="text-right py-3.5 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app, i) => (
                    <motion.tr key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-text-primary">{app.company}</td>
                      <td className="py-3.5 px-4 text-text-secondary">{app.role}</td>
                      <td className="py-3.5 px-4">
                        <select value={app.status} onChange={e => handleStatusChange(app._id, e.target.value)}
                          className="bg-white/5 border border-white/[0.08] rounded-lg text-xs px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent cursor-pointer">
                          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3.5 px-4"><Badge color={statusColors[app.status]}>{app.source}</Badge></td>
                      <td className="py-3.5 px-4 text-text-muted">{new Date(app.appliedDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-text-muted max-w-[180px] truncate hidden md:table-cell">{app.notes || '-'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => handleDelete(app._id)} className="btn-ghost p-1.5 text-text-muted hover:text-error transition-colors"><i className="ti ti-trash text-sm" /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
