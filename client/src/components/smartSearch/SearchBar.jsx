import { Search, X, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, onFilterClick, placeholder = 'Search jobs, companies...' }) {
  return (
    <div className="flex items-center gap-3 bg-[#1A1A1C] rounded-2xl px-4 py-3 mx-4 mt-4">
      <Search size={20} className="text-[#8B8B8F]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-base text-white placeholder-[#8B8B8F] outline-none border-none"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-[#8B8B8F] hover:text-white">
          <X size={20} />
        </button>
      )}
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center w-10 h-10 bg-[#0A0A0A] rounded-full hover:bg-[#1A1A1C]"
      >
        <SlidersHorizontal size={18} className="text-white" />
      </button>
    </div>
  );
}
