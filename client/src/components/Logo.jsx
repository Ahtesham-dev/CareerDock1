export default function Logo({ size = 32, className = '' }) {
  const t = Math.max(size, 64) / size;
  const s = n => Math.round(n * t);
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={className}>
      <defs>
        <linearGradient id={`lg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="50%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>
      <circle cx="512" cy="512" r="390" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(28)}/>
      <line x1="122" y1="512" x2="902" y2="512" stroke={`url(#lg-${size})`} strokeWidth={s(24)}/>
      <line x1="512" y1="122" x2="512" y2="902" stroke={`url(#lg-${size})`} strokeWidth={s(24)}/>
      <path d="M 320 320 A 270 270 0 0 1 700 320" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(26)}/>
      <path d="M 700 320 A 270 270 0 0 1 740 512" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(26)}/>
      <path d="M 320 320 A 270 270 0 0 0 360 740" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(26)}/>
      <path d="M 410 410 A 145 145 0 0 1 600 410" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(24)}/>
      <path d="M 640 470 A 145 145 0 0 1 600 700" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(24)}/>
      <path d="M 410 410 A 145 145 0 0 0 410 640" fill="none" stroke={`url(#lg-${size})`} strokeWidth={s(24)}/>
      <line x1="512" y1="512" x2="760" y2="250" stroke={`url(#lg-${size})`} strokeWidth={s(30)} strokeLinecap="round"/>
      <circle cx="512" cy="512" r="42" fill={`url(#lg-${size})`}/>
      <circle cx="370" cy="345" r="22" fill="#22D3EE"/>
      <circle cx="385" cy="660" r="22" fill="#7C83FF"/>
      <circle cx="760" cy="760" r="22" fill="#A855F7"/>
    </svg>
  );
}
