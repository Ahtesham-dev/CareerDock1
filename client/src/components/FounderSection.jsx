import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LetterReveal } from './BrandText';

export default function FounderSection() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [particles, setParticles] = useState([]);
  const ref = useRef(null);
  const sectionInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    setParticles(Array.from({ length: 15 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 30, driftY: (Math.random() - 0.5) * 20,
    })));
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <section ref={ref} className="relative py-28 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-accent/15 rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ x: [0, p.driftX, 0], y: [0, p.driftY, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 4 + p.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }} className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Crafted with Precision</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
            <span className="text-[9px] text-emerald-400/40">Verified Founder</span>
          </div>
        </motion.div>

        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
          Made by{' '}
          <span className="inline-block"
            style={{ transform: `translate(${(mousePos.x - 0.5) * 6}px, ${(mousePos.y - 0.5) * 6}px)` }}>
            <LetterReveal text="Ahtesham" delay={0.4} />
          </span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 8 }} animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }} className="text-white/40 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Stop searching through thousands of listings. Let AI identify the opportunities that actually match your skills, goals, and ambitions.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}>
          <Link to="/crafted-by-ahtesham"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium px-5 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all active:scale-[0.97] group">
            Read the Story
            <i className="ti ti-arrow-right text-sm group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
