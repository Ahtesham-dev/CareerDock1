const styles = {
  indigo: 'badge-indigo',
  green: 'badge-green',
  amber: 'badge-amber',
  red: 'badge-red',
  gray: 'badge-gray',
  blue: 'badge-blue',
  purple: 'badge-purple'
};

export default function Badge({ children, color = 'gray', className = '', dot }) {
  return (
    <span className={`${styles[color] || styles.gray} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
