import { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { GradientSpan } from '../components/BrandText';

function FadeSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} className="mb-14">
      {children}
    </motion.div>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
}

const milestones = [
  { year: '2023', icon: 'bulb', title: 'The Idea', text: 'CareerDock was born from a simple frustration — job seekers need to check 10 different websites daily to find relevant opportunities. Duplicate listings, expired postings, fake jobs — the noise was unbearable.' },
  { year: '2024', icon: 'code', title: 'The Build', text: 'What started as a simple aggregator grew into a full platform with 9+ scrapers, an AI-powered deduplication engine, smart quality scoring, and a beautiful dashboard designed for clarity.' },
  { year: '2025', icon: 'rocket', title: 'The Launch', text: 'After months of testing and refinement, CareerDock launched to help hundreds of job seekers discover opportunities faster, track applications better, and make data-driven career moves.' },
  { year: '2026', icon: 'sparkles', title: 'The Mission', text: 'Today, CareerDock continues to evolve — with semantic search, ATS matching, career intelligence, and a vision to become the definitive job intelligence platform for professionals worldwide.' },
];

const values = [
  { icon: 'shield-check', title: 'Quality First', desc: 'Every listing passes through our quality engine. If it\'s not genuine, it doesn\'t reach you.' },
  { icon: 'eye', title: 'Radical Transparency', desc: 'No hidden premium tiers, no paywalled features. Great tools should be accessible to everyone.' },
  { icon: 'users', title: 'User-Centric', desc: 'Every feature is designed with one question: does this make the job search easier?' },
  { icon: 'infinity', title: 'Continuous Improvement', desc: 'The platform evolves daily based on real user feedback and changing market needs.' },
];

export default function FounderStory() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  return (
    <div className="min-h-screen bg-[#060E1A] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060E1A]/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
            <i className="ti ti-arrow-left text-sm" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span className="text-xs text-white/30 font-medium">CareerDock</span>
          </div>
        </div>
      </nav>

      <motion.div style={{ scale: heroScale }} className="pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FadeSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02] mb-6">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Founder Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
              Why I Built{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-300">CareerDock</span>
            </h1>
            <p className="text-white/40 text-sm max-w-lg mx-auto">A story of frustration, determination, and the mission to fix job search for everyone.</p>
          </FadeSection>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <FadeSection delay={0.1}>
          <GlassCard>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-violet-300">A</span>
              </div>
              <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  As a student searching for internships and opportunities, I found myself constantly jumping between different job platforms, opening dozens of tabs, and spending hours scrolling through duplicate listings, outdated posts, and irrelevant recommendations.
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  The problem wasn&rsquo;t a lack of opportunities&mdash;it was the overwhelming amount of noise surrounding them.
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  I built CareerDock because I was frustrated with the way job searching worked. I wanted a single place where students, fresh graduates, and professionals could discover meaningful opportunities without wasting time navigating multiple platforms.
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  CareerDock isn&rsquo;t just another job board. It&rsquo;s a smarter way to discover opportunities, cut through the clutter, and focus on what actually matters&mdash;building your future.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/40" />
                  <span className="text-xs text-white/30">&mdash; Ahtesham Aslam, Founder &amp; Developer, CareerDock</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </FadeSection>

        <FadeSection delay={0.2}>
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">The Journey</h2>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-5 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.06] group-hover:border-accent/30 transition-all duration-300">
                    <i className={`ti ti-${m.icon} text-white/40 group-hover:text-accent-light transition-colors text-lg`} />
                  </div>
                  {i < milestones.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-white/[0.06] to-transparent group-hover:from-accent/20 transition-all duration-500" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] text-white/20 font-mono tracking-wider">{m.year}</span>
                    <span className="text-sm font-semibold text-white/70">{m.title}</span>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeSection>

        <FadeSection delay={0.3}>
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">What I Believe In</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all duration-500 group">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3 group-hover:bg-white/[0.08] transition-colors">
                  <i className={`ti ti-${v.icon} text-white/50 group-hover:text-accent-light transition-colors`} />
                </div>
                <h3 className="text-sm font-semibold text-white/70 mb-1">{v.title}</h3>
                <p className="text-xs text-white/30 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </FadeSection>

        <FadeSection delay={0.4}>
          <GlassCard className="text-center !p-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-5 border border-white/[0.06]">
              <i className="ti ti-quote text-white/60 text-lg" />
            </div>
            <p className="text-white/60 italic leading-relaxed text-sm max-w-xl mx-auto">
              &ldquo;I believe job seekers deserve better. Not another job board &mdash; a command center for your career. Every feature in CareerDock is designed with one question in mind: does this make the job search easier?&rdquo;
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="w-1 h-1 rounded-full bg-accent/40" />
              <p className="text-sm font-medium text-white/50"><GradientSpan>Ahtesham</GradientSpan>, Founder</p>
            </div>
          </GlassCard>
        </FadeSection>

        <FadeSection delay={0.5}>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-[#060E1A] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all active:scale-[0.97] shadow-premium-lg">
              Start Your Journey <i className="ti ti-arrow-right text-base" />
            </Link>
            <Link to="/"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm font-medium px-4 py-3 transition-all">
              Explore CareerDock
            </Link>
          </div>
        </FadeSection>

        <FadeSection delay={0.55}>
          <div className="flex items-center justify-center gap-4 pb-6">
            <a href="https://github.com/Ahtesham-dev" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm font-medium px-4 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all group">
              <i className="ti ti-brand-github text-base" />
              <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/ahteshamo6-aslam-/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm font-medium px-4 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all group">
              <i className="ti ti-brand-linkedin text-base" />
              <span>LinkedIn</span>
            </a>
          </div>
        </FadeSection>

        <FadeSection delay={0.6}>
          <div className="border-t border-white/[0.04] pt-8 mt-2">
            <div className="flex items-center justify-center gap-2 text-[10px] text-white/15 font-mono tracking-wider">
              <Logo size={12} />
              <span>&copy; 2026 CareerDock &mdash; Designed &amp; Developed by <GradientSpan>Ahtesham</GradientSpan></span>
            </div>
          </div>
        </FadeSection>
      </div>
    </div>
  );
}
