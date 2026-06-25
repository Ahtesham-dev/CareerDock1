import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  'Connecting job sources...',
  'Analyzing startup openings...',
  'Checking remote opportunities...',
  'Indexing fresh listings...',
  'Matching relevant roles...',
  'Preparing recommendations...',
];

const SOURCES = ['Wellfound', 'YC', 'Peerlist', 'LinkedIn', 'Instahyre', 'Cutshort'];

const SCENE = { BOOT: 0, DISCOVERY: 1, METRICS: 2, FINAL: 3 };

function MetricCounter({ target, duration, active, format }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    let raf;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);

  return format === 'fraction' ? (
    <>{value}<span className="text-text-muted text-3xl"> / {target}</span></>
  ) : (
    <>{value.toLocaleString()}</>
  );
}

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [scene, setScene] = useState(SCENE.BOOT);
  const [messageIndex, setMessageIndex] = useState(0);
  const [periodDots, setPeriodDots] = useState('.');
  const [activeMetric, setActiveMetric] = useState(-1);
  const [dockCount, setDockCount] = useState(0);
  const [showFounder, setShowFounder] = useState(false);
  const [showLightSweep, setShowLightSweep] = useState(false);

  const METRICS = [
    { label: 'Sources Connected', target: 6, duration: 800, format: 'fraction' },
    { label: 'Jobs Indexed', target: 1247, duration: 1200, format: 'number' },
    { label: 'Remote Roles', target: 321, duration: 1000, format: 'number' },
    { label: 'Startup Roles', target: 112, duration: 900, format: 'number' },
  ];

  useEffect(() => {
    const t = [];
    t.push(setTimeout(() => setScene(SCENE.DISCOVERY), 2200));
    t.push(setTimeout(() => setScene(SCENE.METRICS), 6000));
    t.push(setTimeout(() => setActiveMetric(0), 6200));
    t.push(setTimeout(() => setDockCount(1), 6400));
    t.push(setTimeout(() => setActiveMetric(1), 7600));
    t.push(setTimeout(() => setDockCount(2), 7700));
    t.push(setTimeout(() => setActiveMetric(2), 8800));
    t.push(setTimeout(() => setDockCount(3), 8900));
    t.push(setTimeout(() => setDockCount(4), 9100));
    t.push(setTimeout(() => setActiveMetric(3), 9800));
    t.push(setTimeout(() => setDockCount(5), 9900));
    t.push(setTimeout(() => setDockCount(6), 10100));
    t.push(setTimeout(() => setScene(SCENE.FINAL), 10800));
    t.push(setTimeout(() => setShowLightSweep(true), 11500));
    t.push(setTimeout(() => onCompleteRef.current(), 13000));
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (scene < SCENE.DISCOVERY || scene >= SCENE.FINAL) return;
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [scene]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriodDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowFounder(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, anim;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 50;
    const nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 0.5,
      baseOpacity: Math.random() * 0.3 + 0.08,
    }));

    const maxDist = 200;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const lineOpacity = scene >= SCENE.DISCOVERY ? 0.08 : 0.02;
      const finalBoost = scene >= SCENE.FINAL ? 0.15 : 0;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        const opacity = Math.min(n.baseOpacity + finalBoost, 0.6);
        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = Math.max(0, (1 - dist / maxDist) * (lineOpacity + finalBoost));
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      anim = requestAnimationFrame(draw);
    };

    anim = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener('resize', resize);
    };
  }, [scene]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-surface-base flex flex-col items-center justify-center overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="absolute inset-0 bg-gradient-to-b from-accent/3 via-transparent to-accent/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <motion.h1
          animate={{
            fontSize: scene >= SCENE.METRICS ? '40px' : '64px',
            opacity: scene >= SCENE.FINAL ? 0 : 1,
            marginBottom: scene >= SCENE.METRICS ? '2.5rem' : '1.5rem',
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="font-bold tracking-tight leading-none"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 30%, #A1A1AA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CareerDock
        </motion.h1>

        <AnimatePresence mode="wait">
          {scene === SCENE.BOOT && (
            <motion.p
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.5 }}
              className="text-text-muted text-lg"
            >
              Discovering opportunities{periodDots}
            </motion.p>
          )}

          {scene === SCENE.DISCOVERY && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.5 }}
              className="h-8 flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="text-text-muted text-base"
                >
                  {LOADING_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {scene === SCENE.METRICS && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="h-20 flex items-center justify-center mb-8">
                <AnimatePresence mode="wait">
                  {activeMetric >= 0 && (
                    <motion.div
                      key={activeMetric}
                      initial={{ opacity: 0, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(8px)' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className="text-center"
                    >
                      <p className="text-text-muted text-sm mb-1">{METRICS[activeMetric].label}</p>
                      <p className="text-white text-5xl font-bold tracking-tight">
                        <MetricCounter
                          target={METRICS[activeMetric].target}
                          duration={METRICS[activeMetric].duration}
                          active={activeMetric >= 0}
                          format={METRICS[activeMetric].format}
                        />
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3">
                {SOURCES.map((source, i) => (
                  <div key={source} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 h-[3px] rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: i < dockCount ? '#818CF8' : 'rgba(255,255,255,0.08)',
                        boxShadow: i < dockCount ? '0 0 8px rgba(129, 140, 248, 0.3)' : 'none',
                      }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-widest transition-colors duration-300"
                      style={{
                        color: i < dockCount ? 'rgba(129, 140, 248, 0.7)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {source === 'Wellfound' ? 'WF' : source === 'Instahyre' ? 'IH' : source === 'Cutshort' ? 'CS' : source.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scene === SCENE.FINAL && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4"
              >
                Your opportunities are ready.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="text-text-muted text-base"
              >
                Launching dashboard...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showFounder && scene < SCENE.FINAL && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed bottom-8 right-8 z-10"
          >
            <div className="relative overflow-hidden text-right">
              <p className="text-white text-lg font-medium tracking-wider mb-0.5">
                Built by Ahtesham Aslam
              </p>
              {(showLightSweep) && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%, transparent 100%)',
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              )}
            </div>
            <p className="text-white/30 text-sm tracking-wide text-right">
              Building tools that help people find opportunities faster.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
