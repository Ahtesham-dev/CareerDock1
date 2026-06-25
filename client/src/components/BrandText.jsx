import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const gradientStyle = {
  background: 'linear-gradient(135deg, #60A5FA, #818CF8, #C4B5FD)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function GradientSpan({ children, className = '', ...props }) {
  return <span className={className} style={gradientStyle} {...props}>{children}</span>;
}

export function LetterReveal({ text, delay = 0, once = false, color }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const style = color === 'white' ? { color: 'rgba(255,255,255,0.8)' } : gradientStyle;
  return (
    <span ref={ref} className="inline-flex">
      {text.split('').map((char, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={inView || once ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.45, delay: delay + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block" style={style}>{char === ' ' ? '\u00A0' : char}</motion.span>
      ))}
    </span>
  );
}
