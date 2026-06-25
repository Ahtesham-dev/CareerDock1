export default function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        <select {...props} className={`input-field w-full appearance-none cursor-pointer ${className}`}>
          {options.map((opt, i) => (
            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className="ti ti-chevron-down text-text-muted text-sm" />
        </div>
      </div>
    </div>
  );
}
