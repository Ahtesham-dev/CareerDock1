import { motion } from 'framer-motion';
import Logo from './Logo';

export default function BrandBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.1 }}
      className="fixed bottom-4 right-5 flex items-center gap-2.5 pointer-events-none select-none z-40"
    >
      <Logo size={16} />
      <span className="text-white text-sm font-medium tracking-wider" style={{ fontFamily: 'monospace' }}>Ahtesham × CareerDock</span>
    </motion.div>
  );
}
