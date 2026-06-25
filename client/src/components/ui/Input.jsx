export default function Input({ icon, label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <i className={`ti ti-${icon} text-text-muted/60 text-sm`} />
          </div>
        )}
        <input
          {...props}
          className={`input-field w-full ${icon ? 'pl-10' : ''} ${error ? 'input-error' : ''} ${className}`}
        />
      </div>
      {error && <p className="text-error text-xs mt-1 flex items-center gap-1"><i className="ti ti-alert-circle" />{error}</p>}
    </div>
  );
}
