import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { jobsAPI } from '../api';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship'];
const SKILL_OPTIONS = ['React', 'Node.js', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Machine Learning'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', location: '', bio: '', skills: [], preferredTypes: [], salaryExpectation: '', github: '', linkedin: '', portfolio: '' });
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || [],
        preferredTypes: user.preferredTypes || [],
        salaryExpectation: user.salaryExpectation || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if ((profile.skills.length > 0 || profile.preferredTypes.length > 0) && user) {
      setRecLoading(true);
      jobsAPI.getJobs({ skills: profile.skills.join(','), type: profile.preferredTypes.join(','), limit: 3 })
        .then(res => setRecommendations(res.data.jobs || []))
        .catch(() => {})
        .finally(() => setRecLoading(false));
    }
  }, [profile.skills, profile.preferredTypes]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateUser(profile); showToast('Profile updated!', 'success'); } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const toggleSkill = (s) => setProfile(prev => ({ ...prev, skills: prev.skills.includes(s) ? prev.skills.filter(x => x !== s) : [...prev.skills, s] }));
  const toggleType = (t) => setProfile(prev => ({ ...prev, preferredTypes: prev.preferredTypes.includes(t) ? prev.preferredTypes.filter(x => x !== t) : [...prev.preferredTypes, t] }));

  return (
    <div>
      <TopNav title="My Profile" subtitle="Manage your career preferences" />
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white font-bold text-xl">{profile.name?.charAt(0) || '?'}</div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{profile.name || 'Your Name'}</h2>
              <p className="text-sm text-text-muted">{profile.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
            <Input label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            <Input label="Location" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, India" />
            <Input label="Salary Expectation (LPA)" type="number" value={profile.salaryExpectation} onChange={e => setProfile(p => ({ ...p, salaryExpectation: e.target.value }))} placeholder="12" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Bio</label>
            <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Tell us about yourself..."
              className="input-field w-full resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${profile.skills.includes(s) ? 'bg-accent/15 border-accent/30 text-accent-light' : 'bg-white/5 border-white/[0.06] text-text-muted hover:text-text-secondary hover:bg-white/10'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Preferred Job Types</label>
            <div className="flex flex-wrap gap-1.5">
              {JOB_TYPES.map(t => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${profile.preferredTypes.includes(t) ? 'bg-accent/15 border-accent/30 text-accent-light' : 'bg-white/5 border-white/[0.06] text-text-muted hover:text-text-secondary hover:bg-white/10'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Links</label>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input value={profile.github} onChange={e => setProfile(p => ({ ...p, github: e.target.value }))} placeholder="GitHub URL" icon="brand-github" />
              <Input value={profile.linkedin} onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn URL" icon="brand-linkedin" />
              <Input value={profile.portfolio} onChange={e => setProfile(p => ({ ...p, portfolio: e.target.value }))} placeholder="Portfolio URL" icon="world" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleSave} loading={saving} icon="device-floppy">Save Profile</Button>
          </div>
        </motion.div>

        {(profile.skills.length > 0 || profile.preferredTypes.length > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <i className="ti ti-sparkles text-accent-light" /> Recommended Jobs Based on Your Profile
            </h3>
            {recLoading ? (
              <div className="grid sm:grid-cols-3 gap-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
            ) : recommendations.length === 0 ? (
              <div className="card-premium p-6 text-center text-text-muted text-sm">
                No matching jobs found right now. Check back later!
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {recommendations.map(job => (
                  <div key={job._id} className="card-premium-hover p-4 space-y-2">
                    <h4 className="text-sm font-medium text-text-primary truncate">{job.title}</h4>
                    <p className="text-xs text-text-secondary">{job.company}</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span><i className="ti ti-map-pin" />{job.location}</span>
                      {job.salaryLabel && <span className="text-success"><i className="ti ti-coin" />{job.salaryLabel}</span>}
                    </div>
                    <Badge color="indigo" size="sm">{job.source}</Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
