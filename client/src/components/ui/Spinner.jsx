export default function Spinner({ size = 5, className = '' }) {
  return (
    <svg className={`animate-spin text-accent ${className}`} style={{ width: `${size * 4}px`, height: `${size * 4}px` }} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
