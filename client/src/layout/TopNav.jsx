import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNav({ title, subtitle, action }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    if (menuOpen) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-30 bg-surface-base/70 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-6 h-16">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">{title}</h1>
          {subtitle && <p className="text-xs text-text-muted mt-0.5 ml-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button className="btn-ghost p-2 relative" aria-label="Notifications">
            <i className="ti ti-bell text-lg" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface-base" />
          </button>
          <div className="relative" onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <button
              className="flex items-center gap-2.5 btn-ghost pl-2 pr-3 py-1.5 rounded-premium hover:bg-white/5"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-accent-light">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-text-primary leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-text-muted">{user?.email || ''}</p>
              </div>
              <i className="ti ti-chevron-down text-text-muted text-xs" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 card-premium-lg p-1.5 shadow-premium-xl border border-white/[0.08]"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-text-muted">{user?.email || ''}</p>
                  </div>
                  <button onClick={() => { navigate('/settings'); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
                    <i className="ti ti-user text-base" /> Profile
                  </button>
                  <button onClick={() => { navigate('/command-center'); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
                    <i className="ti ti-chart-ppie text-base" /> Statistics
                  </button>
                  <hr className="my-1 border-white/[0.06]" />
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors">
                    <i className="ti ti-logout text-base" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
