import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const items = [
  { path: '/dashboard', icon: 'layout-dashboard', label: 'Feed' },
  { path: '/command-center', icon: 'chart-ppie', label: 'Statistics' },
  { path: '/saved', icon: 'bookmark', label: 'Saved' },
  { path: '/applications', icon: 'clipboard-list', label: 'Apps' },
  { path: '/insights', icon: 'eye', label: 'Insights' }
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-raised/90 backdrop-blur-xl border-t border-white/[0.06] z-40 lg:hidden pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-evenly h-16 px-1 sm:px-2">
        {items.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-2 relative rounded-xl touch-manipulation transition-all duration-200 ${isActive ? 'text-accent-light bg-white/5' : 'text-text-muted'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full"
                />
              )}
              <i className={`ti ti-${item.icon} text-lg`} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
