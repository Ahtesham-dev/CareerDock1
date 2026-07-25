import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SourceFilterPanel from '../components/SourceFilterPanel';
import Logo from '../components/Logo';

export default function MobileDrawer({ open, onClose, activeSources, toggleSource }) {
  const { displayName, logout } = useAuth();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x < -80 || velocity.x < -200) onClose();
            }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-surface-raised border-r border-white/[0.06] flex flex-col lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.06] shrink-0">
              <Logo size={28} />
              <span className="font-bold text-base text-text-primary">CareerDock</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <SourceFilterPanel activeSources={activeSources} toggleSource={toggleSource} />
            </div>

            <div className="shrink-0 border-t border-white/[0.06] p-4 space-y-3">
              <p className="text-sm text-text-muted flex items-center gap-2">
                <i className="ti ti-user-circle text-base" />
                Logged in as: <span className="text-text-primary font-medium">{displayName}</span>
              </p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors"
              >
                <i className="ti ti-logout text-base" /> Logout
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
