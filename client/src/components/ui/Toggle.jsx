import { motion } from 'framer-motion';

export default function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div className="relative" role="switch" aria-checked={checked} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onChange(!checked); }}>
        <motion.div
          animate={{ backgroundColor: checked ? '#4F46E5' : 'rgba(255,255,255,0.1)' }}
          className="w-10 h-6 rounded-full p-0.5 transition-colors"
        >
          <motion.div
            animate={{ x: checked ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 bg-white rounded-full shadow-premium"
          />
        </motion.div>
      </div>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}
