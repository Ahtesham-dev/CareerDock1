import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GradientSpan } from './BrandText';

function LightBeam() {
  return (
    <motion.div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 2 }}
        className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  );
}

export default function FounderFooter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <footer ref={ref} className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-lg mx-auto text-center">
        <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-8 overflow-hidden">
          <LightBeam />

          <p className="text-white/30 text-sm tracking-wider mb-4 font-medium uppercase">Built with precision by</p>

          <Link to="/crafted-by-ahtesham"
            className="group relative inline-block text-[30px] font-bold tracking-tight transition-all duration-300">
            <GradientSpan className="text-[30px] font-bold tracking-tight group-hover:opacity-0 transition-all duration-500">Ahtesham</GradientSpan>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
              <span className="text-[30px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Ahtesham</span>
            </span>
            <motion.span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0 rounded-full"
              initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.3 }} style={{ transformOrigin: 'center' }} />
          </Link>

          <p className="text-white/20 text-sm mt-4 tracking-wide">Transforming how you discover your next opportunity</p>

          <div className="mt-6 pt-5 border-t border-white/[0.04]">
            <div className="flex items-center justify-center gap-3 text-[10px] text-white/15">
              <span className="tracking-wider font-mono">&copy; 2026 CareerDock</span>
              <span className="w-px h-3 bg-white/[0.06]" />
              <span className="tracking-wider font-mono">Designed &amp; Developed by <GradientSpan>Ahtesham</GradientSpan></span>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
