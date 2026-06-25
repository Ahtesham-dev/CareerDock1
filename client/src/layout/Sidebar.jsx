import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../api';
import Badge from '../components/ui/Badge';
import Logo from '../components/Logo';
import { GradientSpan } from '../components/BrandText';

const navItems = [
  { path: '/dashboard', icon: 'layout-dashboard', label: 'Job Feed' },
  { path: '/command-center', icon: 'chart-ppie', label: 'Stats' },
  { path: '/saved', icon: 'bookmark', label: 'Saved Jobs' },
  { path: '/applications', icon: 'clipboard-list', label: 'Applications' },
  { path: '/insights', icon: 'eye', label: 'Insights' },
  { path: '/alerts', icon: 'bell', label: 'Alerts' },
  { path: '/search', icon: 'search', label: 'Search' },
  { path: '/settings', icon: 'settings', label: 'Settings' }
];

const sourceGroups = [
  { label: 'Professional', sources: ['LinkedIn', 'Naukri'] },
  { label: 'Aggregator', sources: ['JSearch'] },
  { label: 'General', sources: ['Internshala', 'Career Pages'] },
  { label: 'Startup', sources: ['Wellfound', 'YCombinator'] },
  { label: 'Community', sources: ['GitHub', 'HackerNews', 'Dev.to', 'Peerlist'] }
];

const sourceColors = { LinkedIn: 'blue', Naukri: 'red', JSearch: 'indigo', Internshala: 'green', 'Career Pages': 'purple', Wellfound: 'amber', GitHub: 'gray', HackerNews: 'amber', 'Dev.to': 'gray', YCombinator: 'orange', Peerlist: 'teal' };

export default function Sidebar({ activeSources, toggleSource, collapsed, onToggle }) {
  const [sourceCounts, setSourceCounts] = useState({});
  const [arrowHovered, setArrowHovered] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    jobsAPI.getSourceCounts()
      .then(res => {
        const map = {};
        (res.data.sources || []).forEach(s => { map[s._id] = s.count; });
        setSourceCounts(map);
      })
      .catch(() => {});
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 248 }}
      className="h-screen bg-surface-raised border-r border-white/[0.06] flex flex-col overflow-hidden shrink-0"
    >
      <div className="p-4 flex items-center gap-3 border-b border-white/[0.06] h-16 shrink-0">
        <motion.div whileHover={{ scale: 1.05 }} className="w-9 h-9 shrink-0">
          <Logo size={36} />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-lg text-text-primary">
              CareerDock
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={onToggle} onMouseEnter={() => setArrowHovered(true)} onMouseLeave={() => setArrowHovered(false)} className="ml-auto btn-ghost p-1.5 rounded-lg hover:bg-white/5" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <i className={`ti ti-chevron-${collapsed ? 'right' : 'left'} text-sm transition-transform`} />
        </button>
      </div>

      <nav className="shrink-0 p-2 space-y-0">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[15px] group ${isActive ? 'bg-accent/10 text-accent-light' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? 'text-accent-light' : ''}`}>
                  <i className={`ti ti-${item.icon} text-lg ${isActive ? '' : 'group-hover:text-text-primary'}`} />
                  {isActive && (
                    <motion.div layoutId="navIndicator" className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full" />
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!collapsed && (
          <div className="p-4 border-t border-white/[0.06]">
            <p className="text-sm text-text-secondary uppercase tracking-widest mb-3 px-1 font-semibold flex items-center gap-2">
              <i className="ti ti-filter text-sm" /> Sources
              <span className="text-xs text-accent-light/80 font-semibold normal-case">({activeSources?.length || 0} active)</span>
            </p>
            <div className="space-y-1.5">
              {sourceGroups.map(group => (
                <div key={group.label}>
                  <p className="text-xs text-text-muted uppercase tracking-[0.12em] px-1.5 py-0.5 font-semibold">{group.label}</p>
                  <div className="space-y-1.5">
                    {group.sources.map(source => (
                      <button
                        key={source}
                        onClick={() => toggleSource(source)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                          activeSources?.includes(source)
                            ? 'text-text-primary bg-white/[0.08] border border-white/[0.08] font-medium'
                            : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${activeSources?.includes(source) ? 'bg-accent shadow-premium' : 'bg-white/30'}`} />
                          <span className="text-sm">{source}</span>
                        </div>
                        <span className="text-xs text-text-muted/60 font-medium">{sourceCounts[source] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.06]">
        <div className="p-3">
          <button onClick={() => { logout(); }} className={`flex items-center gap-3 text-text-muted hover:text-error transition-colors text-sm w-full ${collapsed ? 'justify-center' : 'px-2'}`}>
            <i className="ti ti-logout text-base" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
        {!collapsed && (
          <div className="px-4 pb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-2" />
            <div className="relative flex justify-center">
              <motion.div
                className="absolute inset-0 -inset-x-3 -inset-y-2 rounded-lg bg-gradient-to-br from-accent/10 via-accent-light/15 to-transparent blur-lg pointer-events-none"
                animate={{
                  opacity: arrowHovered ? [0.6, 0.9, 0.6] : [0.15, 0.35, 0.15],
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p
                className="relative text-base text-center tracking-wider font-mono cursor-default transition-all duration-300 ease-out"
                style={{
                  color: arrowHovered ? 'rgba(165,180,252,1)' : 'rgba(165,180,252,0.65)',
                  textShadow: arrowHovered
                    ? '0 0 14px rgba(129,140,248,0.45), 0 0 40px rgba(129,140,248,0.15)'
                    : '0 0 6px rgba(129,140,248,0.10)',
                }}
              >
                Crafted by <GradientSpan>Ahtesham</GradientSpan>
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
