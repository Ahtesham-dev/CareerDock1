import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { savedAPI } from '../api';

const columns = ['saved', 'applied', 'interview', 'rejected', 'offer'];
const columnLabels = { saved: 'Saved', applied: 'Applied', interview: 'Interview', rejected: 'Rejected', offer: 'Offer' };
const columnColors = { saved: 'blue', applied: 'indigo', interview: 'amber', rejected: 'red', offer: 'green' };
const columnIcons = { saved: 'bookmark', applied: 'send', interview: 'calendar', rejected: 'x', offer: 'check' };

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchSaved = () => {
    setLoading(true);
    savedAPI.getSaved()
      .then(res => setSavedJobs(res.data))
      .catch(() => setError('Failed to load saved jobs'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchSaved(); }, []);

  const handleMove = async (id, column) => {
    try { await savedAPI.move(id, column); setSavedJobs(prev => prev.map(j => j._id === id ? { ...j, column } : j)); } catch {}
  };
  const handleDelete = async (id) => {
    try { await savedAPI.remove(id); setSavedJobs(prev => prev.filter(j => j._id !== id)); } catch {}
  };
  const getColumnJobs = (col) => savedJobs.filter(j => j.column === col);

  return (
    <div>
      <TopNav title="Saved Jobs" subtitle="Track your applications visually" />
      <div className="p-4 lg:p-6">
        {error && <div className="card-premium p-4 text-error text-sm mb-4 flex items-center gap-2"><i className="ti ti-alert-circle" />{error}</div>}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {columns.map(c => <div key={c} className="space-y-3"><CardSkeleton /><CardSkeleton /></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {columns.map(col => (
              <div key={col} className="card-premium p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <i className={`ti ti-${columnIcons[col]} text-sm text-text-muted`} />
                    <Badge color={columnColors[col]}>{columnLabels[col]}</Badge>
                  </div>
                  <span className="text-xs text-text-muted font-medium">{getColumnJobs(col).length}</span>
                </div>
                <div className="space-y-2" onDragOver={e => e.preventDefault()} onDrop={e => { const id = e.dataTransfer.getData('text/plain'); if (id) handleMove(id, col); }}>
                  {getColumnJobs(col).map(job => (
                    <motion.div
                      key={job._id} layout
                      draggable onDragStart={e => e.dataTransfer.setData('text/plain', job._id)}
                      className="card-premium-hover p-3 cursor-grab active:cursor-grabbing space-y-1.5 group"
                    >
                      <p className="text-sm font-medium text-text-primary truncate">{job.title}</p>
                      <p className="text-xs text-text-secondary">{job.company}</p>
                      {job.salary && <p className="text-xs text-success font-medium">{job.salary}</p>}
                      <Badge color="gray">{job.source}</Badge>
                      <button onClick={() => handleDelete(job._id)} className="text-xs text-text-muted hover:text-error transition-colors mt-1 flex items-center gap-1">
                        <i className="ti ti-trash" /> Remove
                      </button>
                    </motion.div>
                  ))}
                  {getColumnJobs(col).length === 0 && (
                    <div className="h-20 flex items-center justify-center border-2 border-dashed border-white/[0.06] rounded-premium">
                      <p className="text-xs text-text-muted">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && savedJobs.length === 0 && (
          <div className="card-premium p-12 text-center">
            <i className="ti ti-bookmark-off text-4xl text-text-muted mb-3 block" />
            <p className="text-text-secondary text-sm">No saved jobs yet. Start exploring and save jobs you like!</p>
          </div>
        )}
      </div>
    </div>
  );
}
