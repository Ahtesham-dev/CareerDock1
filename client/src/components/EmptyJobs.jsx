import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientSpan } from './BrandText';

function TypewriterText({ text, speed = 40 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="inline-block w-[2px] h-[1em] bg-accent/60 ml-0.5 align-middle" />}
    </span>
  );
}

export default function EmptyJobs({ onClearFilters, onExploreTrending }) {
  const [particles, setParticles] = useState([]);
  const [searchPhase, setSearchPhase] = useState(0);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, delay: Math.random() * 5,
      drift: (Math.random() - 0.5) * 20,
    })));
    const interval = setInterval(() => setSearchPhase(p => (p + 1) % 4), 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center relative overflow-hidden min-h-[400px]">
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <motion.div key={i} className="absolute rounded-full bg-accent/8"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size * 4, height: p.size * 4 }}
            animate={{ y: [-10, 10, -10], x: [0, p.drift, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 5 + p.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </div>

      <div className="relative z-10 max-w-md">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center relative overflow-hidden">
          <motion.div animate={{ rotate: searchPhase === 0 ? -15 : searchPhase === 1 ? 15 : searchPhase === 2 ? -5 : 0 }}
            transition={{ duration: 0.3 }} className="relative z-10">
            <i className="ti ti-search text-3xl text-white/30" />
          </motion.div>
          <motion.div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"
            animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.div className="absolute -bottom-1 left-1/2 w-8 h-[2px] bg-accent/20 rounded-full"
            animate={{ scaleX: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity }} />
        </motion.div>

        <motion.h3 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-xl font-semibold text-white/80 mb-2">No matching jobs found.</motion.h3>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-white/40 text-sm leading-relaxed mb-6 h-12">
          <TypewriterText text="Ahtesham and CareerDock searched everywhere, but couldn't find a match." speed={25} />
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="flex gap-3 justify-center flex-wrap mb-10">
          {onClearFilters && (
            <button onClick={onClearFilters}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium px-4 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all active:scale-[0.97]">
              <i className="ti ti-adjustments-off text-sm" /> Clear Filters
            </button>
          )}
          {onExploreTrending && (
            <button onClick={onExploreTrending}
              className="inline-flex items-center gap-2 bg-white text-[#060E1A] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-all active:scale-[0.97] shadow-premium">
              <i className="ti ti-trending-up text-sm" /> Explore Trending Jobs
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="border-t border-white/[0.04] pt-6">
          <p className="text-white/20 text-xs italic leading-relaxed">&ldquo;Every great opportunity begins with a single search&rdquo;</p>
          <p className="text-white/10 text-[10px] mt-2 tracking-wider font-medium">&mdash; <GradientSpan>Ahtesham</GradientSpan>, Founder of CareerDock</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
