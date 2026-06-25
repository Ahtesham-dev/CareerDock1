import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopNav from '../layout/TopNav';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Toggle from '../components/ui/Toggle';
import { jobAlertsAPI } from '../api';
import { useToast } from '../context/ToastContext';

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'realtime', label: 'Real-time' },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ keywords: '', location: '', frequency: 'daily', minSalary: '', active: true });
  const { showToast } = useToast();

  const fetchAlerts = () => {
    setLoading(true);
    jobAlertsAPI.getAlerts()
      .then(res => setAlerts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const createAlert = async (e) => {
    e.preventDefault();
    if (!form.keywords.trim()) { showToast('Keywords are required', 'error'); return; }
    try {
      const payload = {
        keywords: form.keywords.split(',').map(k => k.trim()),
        location: form.location || undefined,
        frequency: form.frequency,
        minSalary: form.minSalary ? Number(form.minSalary) : undefined,
        active: form.active,
      };
      const res = await jobAlertsAPI.create(payload);
      setAlerts(prev => [res.data, ...prev]);
      setForm({ keywords: '', location: '', frequency: 'daily', minSalary: '', active: true });
      setShowForm(false);
      showToast('Alert created!', 'success');
    } catch {
      showToast('Failed to create alert', 'error');
    }
  };

  const toggleAlert = async (id, active) => {
      try { await jobAlertsAPI.update(id, { active }); setAlerts(prev => prev.map(a => a._id === id ? { ...a, active } : a)); showToast(active ? 'Alert enabled' : 'Alert paused', 'success'); } catch { showToast('Failed to update', 'error'); }
  };

  const deleteAlert = async (id) => {
      try { await jobAlertsAPI.remove(id); setAlerts(prev => prev.filter(a => a._id !== id)); showToast('Alert deleted', 'info'); } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div>
      <TopNav title="Job Alerts" subtitle="Get notified about new opportunities"
        action={
          <Button variant="primary" size="sm" icon="plus" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Alert'}
          </Button>
        }
      />
      <div className="p-4 lg:p-6 space-y-4">
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={createAlert} className="card-premium p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Keywords (comma separated)" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} placeholder="React, Node.js, remote" required />
              <Input label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, Remote" />
              <Select label="Frequency" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} options={FREQ_OPTIONS} />
              <Input label="Min Salary (LPA)" type="number" value={form.minSalary} onChange={e => setForm(p => ({ ...p, minSalary: e.target.value }))} placeholder="10" />
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={form.active} onChange={v => setForm(p => ({ ...p, active: v }))} label="Active" />
              <Button type="submit" variant="primary" icon="bell">Create Alert</Button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card-premium h-20 animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <i className="ti ti-bell-off text-4xl text-text-muted mb-3 block" />
            <p className="text-text-secondary text-sm">No alerts yet. Create one to stay updated!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <motion.div key={alert._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card-premium-hover p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-text-primary">{(alert.keywords || []).join(', ')}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${alert.active ? 'bg-success/15 text-success' : 'bg-white/10 text-text-muted'}`}>
                      {alert.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-1.5 flex-wrap">
                    {alert.location && <span><i className="ti ti-map-pin" /> {alert.location}</span>}
                    <span><i className="ti ti-clock" /> {alert.frequency}</span>
                    {alert.minSalary && <span><i className="ti ti-coin" /> ₹{alert.minSalary}L+</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={alert.active} onChange={v => toggleAlert(alert._id, v)} />
                  <button onClick={() => deleteAlert(alert._id)} className="btn-ghost p-2 text-text-muted hover:text-error transition-colors"><i className="ti ti-trash" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
