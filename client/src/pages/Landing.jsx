import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import FounderSection from '../components/FounderSection';
import FounderFooter from '../components/FounderFooter';

function useCountUp(end, duration = 2, start = 0) {
  const [value, setValue] = useState(start);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(start + (end - start) * ease));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration, start]);

  return { ref, value };
}

const particles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 1,
  speed: Math.random() * 20 + 10,
  opacity: Math.random() * 0.4 + 0.1,
  drift: (Math.random() - 0.5) * 30,
}));

const whyCards = [
  { icon: 'shield-check', title: 'Verified Opportunities', desc: 'Every listing passes through our quality engine. Fake, expired, and duplicate postings are filtered before you ever see them.', gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent' },
  { icon: 'sparkles', title: 'AI-Powered Discovery', desc: 'Our engine learns your preferences, skills, and career goals to surface opportunities most relevant to you — not just the newest ones.', gradient: 'from-violet-500/20 via-purple-500/10 to-transparent' },
  { icon: 'copy-check', title: 'Duplicate Detection', desc: 'Same job on LinkedIn, Naukri, and Wellfound? You see it once. Our dedup engine runs on every new batch automatically.', gradient: 'from-emerald-500/20 via-green-500/10 to-transparent' },
  { icon: 'layers-intersect', title: 'Smart Matching', desc: 'Beyond keywords. Our system understands context — "React Developer" and "Frontend Engineer" with React experience are the same opportunity.', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent' },
  { icon: 'world', title: 'Remote & Global', desc: 'Geographic boundaries dont exist in the modern job market. CareerDock brings opportunities from every corner of the world.', gradient: 'from-sky-500/20 via-blue-500/10 to-transparent' },
  { icon: 'columns-3', title: 'Visual Pipeline', desc: 'From discovery to offer, track every application on a Kanban board. Know where you stand at every stage of your job search.', gradient: 'from-rose-500/20 via-pink-500/10 to-transparent' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Senior Frontend Engineer', company: 'Razorpay', text: 'I was applying to 30+ jobs a week on different platforms. CareerDock saved me 10 hours a week and I found my current role through their smart matching.', rating: 5, initials: 'PS' },
  { name: 'Arun Kumar', role: 'Product Manager', company: 'Flipkart', text: 'The duplicate detection alone is worth it. I was seeing the same jobs reposted across 4-5 platforms. Now I see one version and apply with confidence.', rating: 5, initials: 'AK' },
  { name: 'Sneha Patel', role: 'Data Scientist', company: 'Swiggy', text: 'The quality scoring helped me focus on genuine opportunities instead of wasting time on expired or suspicious listings. Landed my dream role in 3 weeks.', rating: 5, initials: 'SP' },
  { name: 'Rahul Verma', role: 'Backend Engineer', company: 'Cred', text: 'CareerDock\'s market insights showed me which skills were actually in demand in Bangalore. I upskilled strategically and got 3 offers in a month.', rating: 5, initials: 'RV' },
];

const faqs = [
  { q: 'How does CareerDock detect duplicate job listings?', a: 'Our deduplication engine analyzes title, company, description, skills, location, and salary using TF-IDF similarity, semantic embeddings, and fuzzy matching. The same job posted on LinkedIn, Naukri, and Wellfound appears once in your feed.' },
  { q: 'Is CareerDock really free?', a: 'Yes, completely free. No hidden charges, no premium tiers, no credit card required. We believe quality job discovery should be accessible to everyone.' },
  { q: 'Which job sources does CareerDock cover?', a: 'LinkedIn, Naukri, Wellfound (AngelList), Internshala, JSearch, GitHub, HackerNews, Dev.to, and direct career pages from top companies like Razorpay, Swiggy, and more.' },
  { q: 'How does the quality scoring work?', a: 'Each job gets a 0-100 quality score based on salary presence, remote options, company reputation, description detail, skill richness, source verification, and posting freshness. Anything below 30 is automatically filtered.' },
  { q: 'Can I track my applications on CareerDock?', a: 'Absolutely. Use the visual Kanban board to track every application from Saved → Applied → Interview → Offer → Rejected. Move cards by dragging or clicking.' },
];

function DockVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-radial from-prime/8 via-transparent to-transparent" />
      <div className="relative flex items-center justify-center w-full h-full p-8">
        <img
          src="/Hero.png"
          alt="CareerDock Hero"
          className="w-full h-full object-contain rounded-2xl"
        />
        <div className="w-[70%] h-[70%] rounded-full border border-dashed border-white/[0.02]" />
      </div>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5, o: Math.random() * 0.5 + 0.1,
    }));

    let anim;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${d.o})`;
        ctx.fill();
      });
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 180)})`;
            ctx.stroke();
          }
        });
      });
      anim = requestAnimationFrame(draw);
    };
    anim = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0.85]);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const stats = useCountUp(35000, 3);
  const dupStats = useCountUp(9400, 3);
  const fakeStats = useCountUp(2800, 3);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#07080d] text-white overflow-hidden">
      <ParticleField />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#07080d]/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size={28} />
            <span className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors tracking-tight">CareerDock</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Testimonials', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-xs text-white/40 hover:text-white/80 transition-colors tracking-wide uppercase font-medium">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-xs text-white/60 hover:text-white/90 transition-colors font-medium px-3 py-2">Sign In</Link>
            <Link to="/register" className="relative inline-flex items-center gap-1.5 bg-white text-[#07080d] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-all active:scale-[0.97]">
              Get Started
            </Link>
            <button className="md:hidden premium-btn-ghost p-1.5" onClick={() => setMenuOpen(!mobileMenuOpen)}>
              <i className={`ti ti-${mobileMenuOpen ? 'x' : 'menu-2'} text-lg text-white/60`} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-white/[0.04]">
              <div className="px-4 py-4 space-y-3">
                {['Features', 'Testimonials', 'FAQ'].map(item => (
                  <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                    className="block text-sm text-white/50 hover:text-white/90 transition-colors py-1">{item}</a>
                ))}
                <Link to="/login" className="block text-sm text-white/70 font-medium py-1">Sign In</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <motion.section style={{ scale: heroScale, opacity: heroOpacity }} className="relative min-h-screen flex items-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-[40%] h-[60%] bg-blue-500/5 rounded-full blur-[180px]" />
          <div className="absolute bottom-[5%] right-[10%] w-[35%] h-[50%] bg-violet-500/5 rounded-full blur-[160px]" />
          <div className="absolute top-[40%] left-[50%] w-[25%] h-[35%] bg-cyan-400/4 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] text-white/40 uppercase tracking-widest font-medium mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
                  Now in Public Beta
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="text-white/90">Find the Opportunities</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-300">Others Never See.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base text-white/40 leading-relaxed max-w-xl">
                The intelligent career platform that cuts through fake listings, duplicates, expired postings, and endless noise to surface opportunities worth your time.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-3 pt-2">
                <Link to="/register"
                  className="relative group inline-flex items-center gap-2 bg-white text-[#07080d] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all active:scale-[0.97]">
                  Explore Jobs
                  <i className="ti ti-arrow-right text-base group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/register"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 font-medium text-sm px-6 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all">
                  Get Started
                  <i className="ti ti-external-link text-sm" />
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-6 pt-4">
                {[
                  { count: '9+', label: 'Sources' },
                  { count: '10K+', label: 'Live Jobs' },
                  { count: '100%', label: 'Free' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/80">{item.count}</span>
                    <span className="text-[11px] text-white/30">{item.label}</span>
                    {i < 2 && <span className="w-px h-3 bg-white/[0.06] ml-1" />}
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
              className="relative h-[400px] lg:h-[550px] rounded-2xl overflow-hidden border border-white/[0.04] bg-[#07080d]/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-transparent to-transparent z-10" />
              <DockVisual />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.04]">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                    <i className="ti ti-shield-check text-emerald-400 text-xs" />
                  </div>
                  <span className="text-[11px] text-white/50">AI Quality Filter Active — <span className="text-white/80">24,580 jobs verified today</span></span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <FounderSection />

      <section id="features" className="relative py-28 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">Why CareerDock</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-300">Clarity</span>
            </h2>
            <p className="text-sm text-white/40 max-w-xl mx-auto">Built for Professionals Who Refuse to Settle. Discover verified opportunities, hidden openings, and high-quality roles without drowning in job board clutter.</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whyCards.map((card, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                    <i className={`ti ti-${card.icon} text-white/60 group-hover:text-white/90 transition-colors text-lg`} />
                  </div>
                  <h3 className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors">{card.title}</h3>
                  <p className="text-xs text-white/30 group-hover:text-white/40 transition-colors leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] via-white/[0.02] to-white/[0.01]" />
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">The Problem</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Stop{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-300">Drowning</span>{' '}
              in Noise
            </h2>
            <p className="text-sm text-white/40 max-w-xl mx-auto">The average job seeker wastes 12 hours a week filtering through noise. CareerDock fixes that.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {[
              { count: stats.ref, value: stats.value, suffix: '+', label: 'Duplicate Listings', sub: 'across 9 platforms', color: 'from-amber-400/20 to-transparent', icon: 'copy' },
              { count: dupStats.ref, value: dupStats.value, suffix: '+', label: 'Expired Jobs', sub: 'still posted online', color: 'from-orange-400/20 to-transparent', icon: 'clock' },
              { count: fakeStats.ref, value: fakeStats.value, suffix: '+', label: 'Fake Openings', sub: 'detected and removed', color: 'from-rose-400/20 to-transparent', icon: 'alert-triangle' },
              { label: '78%', value: null, sub: 'of listings have duplicates', color: 'from-violet-400/20 to-transparent', icon: 'trending-up' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 overflow-hidden group hover:bg-white/[0.04] transition-all duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10">
                  <i className={`ti ti-${item.icon} text-white/20 text-2xl mb-3 block`} />
                  <p className="text-3xl font-bold text-white/90 tracking-tight">
                    {item.value !== null ? <span ref={item.count}>{item.value}{item.suffix || ''}</span> : item.label}
                  </p>
                  {item.value !== null && <p className="text-xs text-white/40 mt-1">{item.label}</p>}
                  <p className="text-[11px] text-white/20 mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
            className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-indigo-500/3 to-violet-500/3" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.04]">
                  <i className="ti ti-waves text-white/40 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Ocean of Noise</p>
                  <p className="text-xs text-white/30">35,000+ listings monthly</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-20 h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <i className="ti ti-arrow-right text-white/40" />
                </div>
                <div className="w-20 h-px bg-gradient-to-r from-white/20 via-prime to-violet-400" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-prime/10 flex items-center justify-center border border-prime/20">
                  <i className="ti ti-sparkles text-prime-light text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">CareerDock AI Engine</p>
                  <p className="text-xs text-white/30">Quality scoring + dedup + matching</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-20 h-px bg-gradient-to-r from-violet-400 via-white/20 to-white/0" />
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <i className="ti ti-arrow-right text-white/40" />
                </div>
                <div className="w-20 h-px bg-gradient-to-r from-white/20 to-white/0" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <i className="ti ti-shield-check text-emerald-400 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Relevant Opportunities</p>
                  <p className="text-xs text-white/30">What actually matters to you</p>
                </div>
              </div>
            </div>
            <div className="flex md:hidden items-center justify-center gap-1 mt-4">
              <i className="ti ti-arrow-down text-white/20 text-sm" />
              <i className="ti ti-arrow-down text-white/30 text-sm" />
              <i className="ti ti-arrow-down text-white/20 text-sm" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="testimonials" className="relative py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">Trusted by Job Seekers</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              From{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-300">Chaos</span>{' '}
              to Clarity
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <i key={s} className={`ti ti-star text-xs ${s < t.rating ? 'text-amber-400/80' : 'text-white/10'}`} />
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                    <span className="text-xs font-medium text-white/60">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{t.name}</p>
                    <p className="text-xs text-white/30">{t.role} — {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="faq" className="relative py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Questions, Answered</h2>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-white/[0.04] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm text-white/70 hover:text-white/90 hover:bg-white/[0.02] transition-all">
                  <span className="font-medium">{faq.q}</span>
                  <i className={`ti ti-chevron-down text-white/30 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="px-5 pb-4 text-xs text-white/40 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/3 to-violet-500/3" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.04] bg-white/[0.02]">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">Get Started</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              Ready to Dock Your Career<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-300">at the Right Opportunity?</span>
            </h2>
            <p className="text-sm text-white/40 max-w-lg mx-auto">Join thousands of professionals who discovered their next role through CareerDock. No noise. No spam. Just opportunities.</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/register"
                className="relative group inline-flex items-center gap-2 bg-white text-[#07080d] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all active:scale-[0.97]">
                Start Free
                <i className="ti ti-arrow-right text-base group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/register"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 font-medium text-sm px-6 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all">
                Explore Opportunities
              </Link>
            </div>
            <p className="text-xs text-white/20">No credit card required. 100% free. Always.</p>
          </motion.div>
        </div>
      </section>

      <FounderFooter />
    </div>
  );
}