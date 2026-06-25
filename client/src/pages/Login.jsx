import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import Logo from '../components/Logo';
import { GradientSpan } from '../components/BrandText';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid credentials'); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-surface-base flex">
      <div className="hidden lg:flex w-1/2 bg-surface-raised items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-600/5" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-md text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10">
              <Logo size={40} />
            </div>
            <span className="font-bold text-2xl text-white">CareerDock</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-bold text-white mb-4">Your Career Deserves Better Than Endless Scrolling.</motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-text-secondary text-lg">One platform. Cleaner opportunities. Smarter matching. Faster decisions.</motion.p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="card-premium-lg p-8">
            <h2 className="text-2xl font-bold mb-1">Sign In</h2>
            <p className="text-text-muted text-sm mb-8">Access your job dashboard</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5 font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field w-full" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5 font-medium">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field w-full" placeholder="••••••••" />
              </div>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-error text-sm flex items-center gap-1.5 bg-error/5 px-3 py-2 rounded-lg"><i className="ti ti-alert-circle" />{error}</motion.p>}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 h-11">
                {loading && <Spinner size={4} />} Sign In
              </button>
            </form>
            <p className="text-center text-sm text-text-muted mt-6">Don't have an account? <Link to="/register" className="text-accent-light hover:text-accent font-medium transition-colors">Register</Link></p>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-4 right-5 flex items-center gap-2.5 pointer-events-none select-none z-40 opacity-[0.1]">
        <Logo size={16} />
        <span className="text-white text-xs font-medium tracking-wider font-mono"><GradientSpan>Ahtesham</GradientSpan> &times; CareerDock</span>
      </div>
    </div>
  );
}
