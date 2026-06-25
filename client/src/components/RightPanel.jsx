import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { insightsAPI } from '../api';

export default function RightPanel({ open, onClose }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !insights) {
      setLoading(true);
      insightsAPI.getInsights()
        .then(res => setInsights(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, insights]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-surface-raised border-l border-white/[0.06] z-50 shadow-premium-xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-surface-raised/80 backdrop-blur-xl border-b border-white/[0.06] p-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-text-primary">Market Insights</h2>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><i className="ti ti-x text-lg" /></button>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-premium animate-pulse" />)}
                </div>
              ) : insights ? (
                <>
                  <div className="card-premium p-4">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">Total Jobs</p>
                    <p className="text-2xl font-bold text-gradient mt-1">{insights.totalJobs?.toLocaleString() || 0}</p>
                  </div>
                  <div className="card-premium p-4">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">Avg Salary</p>
                    <p className="text-2xl font-bold text-success mt-1">₹{Math.round((insights.avgSalary || 0) / 100000)}L</p>
                  </div>
                  <div className="card-premium p-4">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">Remote Jobs</p>
                    <p className="text-2xl font-bold text-accent-light mt-1">{insights.remotePercent || 0}%</p>
                  </div>
                  <div className="card-premium p-4">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(insights.topSkills || []).slice(0, 8).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-accent/8 text-accent-light rounded-lg text-xs border border-accent/15">{s._id}</span>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
