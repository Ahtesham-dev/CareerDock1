import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';
import { jobsAPI, savedAPI } from '../api';
import { useToast } from '../context/ToastContext';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemAnim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const { showToast } = useToast();

  const doSearch = (p = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setPage(p);
    jobsAPI.getJobs({ q: query.trim(), page: p, limit: 12, type: filterType || undefined, exp: filterExp || undefined })
      .then(res => {
        setResults(res.data.jobs || []);
        setTotalPages(res.data.pages || 0);
        setTotal(res.data.total || 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => { if (query.trim().length >= 2) doSearch(1); }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleSave = async (job) => {
    try { await savedAPI.save({ jobId: job._id, title: job.title, company: job.company, source: job.source }); showToast('Saved!', 'success'); } catch { showToast('Failed to save', 'error'); }
  };

  const sourceColors = { LinkedIn: 'blue', Naukri: 'red', Internshala: 'green', JSearch: 'indigo', Wellfound: 'amber', GitHub: 'gray' };

  return (
    <div>
      <TopNav title="Search Jobs" subtitle="Find your next opportunity" />
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="card-premium p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, skill, company..."
                className="input-field w-full pl-10 h-11 text-sm" onKeyDown={e => e.key === 'Enter' && doSearch(1)} />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field h-11 text-sm w-auto"><option value="">All Types</option><option>Full-time</option><option>Remote</option><option>Hybrid</option><option>Contract</option><option>Internship</option></select>
            <select value={filterExp} onChange={e => setFilterExp(e.target.value)} className="input-field h-11 text-sm w-auto"><option value="">All Levels</option><option>Fresher</option><option>Mid-level</option><option>Senior</option><option>Lead</option></select>
          </div>
          <div className="flex items-center justify-between">
            {hasSearched && !loading && <p className="text-xs text-text-muted">{total} result{total !== 1 ? 's' : ''} found</p>}
            {totalPages > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <button disabled={page <= 1} onClick={() => doSearch(page - 1)} className="btn-ghost p-1.5 text-text-muted disabled:opacity-30"><i className="ti ti-chevron-left" /></button>
                <span className="text-xs text-text-muted">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => doSearch(page + 1)} className="btn-ghost p-1.5 text-text-muted disabled:opacity-30"><i className="ti ti-chevron-right" /></button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : !hasSearched ? (
          <div className="card-premium p-16 text-center">
            <i className="ti ti-search text-5xl text-text-muted mb-4 block" />
            <p className="text-text-secondary text-sm">Enter a search query above to find jobs</p>
          </div>
        ) : results.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <i className="ti ti-file-search text-4xl text-text-muted mb-3 block" />
            <p className="text-text-secondary text-sm">No results found. Try different keywords.</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(job => (
              <motion.div key={job._id} variants={itemAnim} className="card-premium-hover p-5 space-y-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary truncate group-hover:text-accent-light transition-colors">{job.title}</h3>
                    <p className="text-xs text-text-secondary">{job.company}</p>
                  </div>
                  <Badge color={sourceColors[job.source] || 'gray'} size="sm">{job.source}</Badge>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-text-muted flex-wrap">
                  <span><i className="ti ti-map-pin" />{job.location}</span>
                  {job.type && <span><i className="ti ti-briefcase" />{job.type}</span>}
                  {job.salaryLabel && <span className="text-success"><i className="ti ti-coin" />{job.salaryLabel}</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <Button size="sm" variant="ghost" icon="bookmark" onClick={() => handleSave(job)}>Save</Button>
                  <button onClick={() => window.open(job.externalUrl, '_blank')} className="btn-ghost p-1.5 text-text-muted hover:text-text-primary ml-auto"><i className="ti ti-external-link" /></button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
