import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CardSkeleton, StatSkeleton } from '../components/ui/Skeleton';
import EmptyJobs from '../components/EmptyJobs';
import RightPanel from '../components/RightPanel';
import { useToast } from '../context/ToastContext';
import { jobsAPI, savedAPI, applicationsAPI, feedbackAPI } from '../api';

const ALL_SKILLS = ['React', 'Node.js', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend', 'Full Stack', 'Mobile'];
const sourceColors = { LinkedIn: 'blue', Naukri: 'red', JSearch: 'indigo', Internshala: 'green', 'Career Pages': 'purple', Wellfound: 'amber', GitHub: 'gray', HackerNews: 'amber', 'Dev.to': 'gray' };

const container = { show: { transition: { staggerChildren: 0.05 } } };
const itemAnim = { show: { opacity: 1, y: 0 } };

function JobCard({ job, savedIds, appliedIds, onSave, onApply, onFeedback }) {
  return (
    <motion.div variants={itemAnim} className="card-premium-hover p-5 space-y-3.5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-primary truncate group-hover:text-accent-light transition-colors">{job.title}</h3>
            {job.featured && <Badge color="indigo" dot>Featured</Badge>}
            {job.dupGroup && <Badge color="amber" dot>Duplicate</Badge>}
          </div>
          <p className="text-sm text-text-secondary">{job.company}</p>
        </div>
        <Badge color={sourceColors[job.source] || 'gray'}>{job.source}</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
        <span className="flex items-center gap-1"><i className="ti ti-map-pin" />{job.location}</span>
        <span className="flex items-center gap-1"><i className="ti ti-briefcase" />{job.type}</span>
        {job.experience && <span className="flex items-center gap-1"><i className="ti ti-users" />{job.experience}</span>}
        {job.salaryLabel && <span className="flex items-center gap-1 text-success font-medium"><i className="ti ti-coin" />{job.salaryLabel}</span>}
        <span className="flex items-center gap-1"><i className="ti ti-clock" />{new Date(job.postedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(job.skills || []).slice(0, 5).map((s, i) => (
          <span key={i} className="px-2 py-0.5 bg-white/5 rounded-lg text-xs text-text-muted border border-white/[0.06]">{s}</span>
        ))}
        {(job.skills || []).length > 5 && <span className="px-2 py-0.5 text-xs text-text-muted">+{job.skills.length - 5}</span>}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
        {savedIds.has(job._id) ? (
          <Button size="sm" variant="secondary" disabled><i className="ti ti-bookmark-filled text-accent-light" /> Saved</Button>
        ) : (
          <Button size="sm" variant="ghost" icon="bookmark" onClick={() => onSave(job)}>Save</Button>
        )}
        {appliedIds.has(job._id) ? (
          <Button size="sm" variant="success" disabled><i className="ti ti-check" /> Applied</Button>
        ) : (
          <Button size="sm" variant="primary" icon="send" onClick={() => onApply(job._id)}>Apply</Button>
        )}
        {job.externalUrl && (
          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 ml-auto text-text-muted hover:text-text-primary">
            <i className="ti ti-external-link" />
          </a>
        )}
        <div className="flex gap-0.5">
          <button onClick={() => onFeedback(job._id, 'up')} className="btn-ghost p-1.5 text-xs text-text-muted hover:text-success"><i className="ti ti-thumb-up" /></button>
          <button onClick={() => onFeedback(job._id, 'down')} className="btn-ghost p-1.5 text-xs text-text-muted hover:text-error"><i className="ti ti-thumb-down" /></button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard({ activeSources = [] }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState([]);
  const [type, setType] = useState('');
  const [exp, setExp] = useState('');
  const [sort, setSort] = useState('newest');
  const [stats, setStats] = useState({ total: 0, page: 1, pages: 1 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const { showToast } = useToast();
  const searchTimer = useRef(null);

  const fetchJobs = () => {
    setLoading(true); setError('');
    const params = { page: stats.page, limit: 20, sort, q: q || undefined };
    if (skills.length) params.skills = skills.join(',');
    if (type) params.type = type;
    if (exp) params.exp = exp;
    if (activeSources.length) params.sources = activeSources.join(',');
    jobsAPI.getJobs(params)
      .then(res => { setJobs(res.data.jobs); setStats(prev => ({ ...prev, total: res.data.total, pages: res.data.pages })); })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [stats.page, skills, type, exp, sort, activeSources]);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { if (q !== undefined) fetchJobs(); }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [q]);

  useEffect(() => {
    savedAPI.getSaved().then(res => setSavedIds(new Set(res.data.map(s => s.jobId)))).catch(() => {});
    applicationsAPI.getApplications().then(res => setAppliedIds(new Set(res.data.map(a => a.jobId)))).catch(() => {});
  }, []);

  const handleSave = async (job) => {
    try { await savedAPI.save({ jobId: job._id, title: job.title, company: job.company, source: job.source, salary: job.salaryLabel }); setSavedIds(prev => new Set(prev).add(job._id)); showToast('Job saved!', 'success'); }
    catch { showToast('Failed to save', 'error'); }
  };
  const handleApply = async (jobId) => {
    try { await applicationsAPI.autoApply(jobId); setAppliedIds(prev => new Set(prev).add(jobId)); showToast('Application recorded!', 'success'); }
    catch (err) { showToast(err.response?.status === 409 ? 'Already applied' : 'Failed to apply', 'warning'); }
  };
  const handleFeedback = async (jobId, vote) => {
    try { await feedbackAPI.submit(jobId, vote, ''); showToast(vote === 'up' ? 'Upvoted!' : 'Downvoted', 'success'); }
    catch { showToast('Failed to submit feedback', 'error'); }
  };

  return (
    <div>
      <TopNav title="Job Feed" subtitle={`${stats.total} jobs found`}
        action={<Button variant="ghost" icon="chart-ppie" onClick={() => setPanelOpen(true)} className="hidden sm:flex">Insights</Button>} />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="card-premium p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs, companies, skills..." className="input-field w-full pl-10 h-10" />
            </div>
            <div className="relative">
              <button onClick={() => setSkillsOpen(!skillsOpen)} onBlur={() => setTimeout(() => setSkillsOpen(false), 200)} className={`input-field flex items-center gap-2 h-10 text-sm cursor-pointer ${skills.length > 0 ? 'text-accent-light border-accent/30' : ''}`}>
                <i className="ti ti-code text-base" /> Skills{skills.length > 0 && <span className="text-xs bg-accent/20 text-accent-light px-1.5 py-0.5 rounded font-semibold">{skills.length}</span>}
                <i className={`ti ti-chevron-down text-xs ml-2 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
              </button>
              {skillsOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 card-premium-lg p-2 shadow-premium-xl border border-white/[0.08] z-20 max-h-60 overflow-y-auto" onMouseDown={e => e.preventDefault()}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider px-1.5 py-1 font-semibold">Select Skills</p>
                  <div className="space-y-0.5">
                    {ALL_SKILLS.map(s => (
                      <button key={s} onMouseDown={() => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${skills.includes(s) ? 'bg-accent/15 text-accent-light' : 'text-text-muted hover:text-text-secondary hover:bg-white/5'}`}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${skills.includes(s) ? 'bg-accent border-accent' : 'border-white/20'}`}>
                          {skills.includes(s) && <i className="ti ti-check text-[8px] text-white" />}
                        </div>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <select value={type} onChange={e => setType(e.target.value)} className="input-field w-auto h-10 text-sm"><option value="">All Types</option><option value="Full-time">Full-time</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option></select>
            <select value={exp} onChange={e => setExp(e.target.value)} className="input-field w-auto h-10 text-sm"><option value="">All Levels</option><option value="Fresher">Fresher</option><option value="Mid-level">Mid-level</option><option value="Senior">Senior</option></select>
            <select value={sort} onChange={e => setSort(e.target.value)} className="input-field w-auto h-10 text-sm"><option value="newest">Newest</option><option value="salary">Highest Salary</option><option value="match">Best Match</option></select>
          </div>
        </div>

        {error && <div className="card-premium p-4 text-error text-sm flex items-center gap-2 bg-error/5"><i className="ti ti-alert-circle" />{error}</div>}

        {loading ? (
          <motion.div layout className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </motion.div>
        ) : jobs.length === 0 ? (
          <EmptyJobs onClearFilters={() => { setQ(''); setSkills([]); setType(''); setExp(''); }} onExploreTrending={() => setPanelOpen(true)} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job._id} job={job} savedIds={savedIds} appliedIds={appliedIds} onSave={handleSave} onApply={handleApply} onFeedback={handleFeedback} />)}
          </motion.div>
        )}

        {stats.pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button variant="ghost" disabled={stats.page <= 1} onClick={() => setStats(prev => ({ ...prev, page: prev.page - 1 }))}>
              <i className="ti ti-chevron-left" /> Previous
            </Button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(stats.pages, 5) }, (_, i) => (
                <button key={i} onClick={() => setStats(prev => ({ ...prev, page: i + 1 }))}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${stats.page === i + 1 ? 'bg-accent text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}>{i + 1}</button>
              ))}
              {stats.pages > 5 && <span className="text-text-muted text-xs">...</span>}
            </div>
            <Button variant="ghost" disabled={stats.page >= stats.pages} onClick={() => setStats(prev => ({ ...prev, page: prev.page + 1 }))}>
              Next <i className="ti ti-chevron-right" />
            </Button>
          </div>
        )}
      </div>
      <RightPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
