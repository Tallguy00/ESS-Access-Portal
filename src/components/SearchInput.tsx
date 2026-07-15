import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  id,
  className = '',
  containerClassName = '',
}: SearchInputProps) {
  const uniqueId = id || React.useId();

  return (
    <div className={`relative flex-1 ${containerClassName}`}>
      {/* Search icon */}
      <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />

      {/* Styled text input */}
      <input
        type="text"
        id={uniqueId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-8 py-2 text-xs border rounded-xl focus:outline-none transition-all ${
          className || ''
        } bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-350 dark:focus:border-slate-700`}
      />

      {/* Interactive clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Clear search"
          id={`${uniqueId}-clear`}
        >
          <X className="w-4 h-4 hidden" />
        </button>
      )}
    </div>
  );
}
