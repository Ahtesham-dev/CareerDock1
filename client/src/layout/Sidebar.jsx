import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SourceFilterPanel from '../components/SourceFilterPanel';
import Logo from '../components/Logo';
import { GradientSpan } from '../components/BrandText';

const navItems = [
  { path: '/dashboard', icon: 'layout-dashboard', label: 'Job Feed' },
  { path: '/command-center', icon: 'chart-ppie', label: 'Statistics' },
  { path: '/saved', icon: 'bookmark', label: 'Saved Jobs' },
  { path: '/applications', icon: 'clipboard-list', label: 'Applications' },
  { path: '/insights', icon: 'eye', label: 'Insights' },
  { path: '/alerts', icon: 'bell', label: 'Alerts' },
  { path: '/search', icon: 'search', label: 'Search' },
  { path: '/settings', icon: 'settings', label: 'Settings' }
];

export default function Sidebar({ activeSources, toggleSource, collapsed, onToggle }) {
  const [arrowHovered, setArrowHovered] = useState(false);
  const { logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 248 }}
      className="h-screen bg-surface-raised border-r border-white/[0.06] flex flex-col overflow-hidden shrink-0 min-w-0"
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
          <div className="border-t border-white/[0.06]">
            <SourceFilterPanel activeSources={activeSources} toggleSource={toggleSource} />
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
