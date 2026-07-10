import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
  autoFocus?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search requests, users, systems...",
  id,
  className = "",
  containerClassName = "",
  autoFocus = false,
}: SearchInputProps) {
  const uniqueId = id || React.useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }

    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "Escape") {
        onChange("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [autoFocus, onChange]);

  return (
    <div className={`relative w-full ${containerClassName}`}>
      {/* # + K Badge */}
      <div
        className="
          absolute
          left-3
          top-3
          -translate-y-1/2
          flex
          items-center
          gap-1
          rounded-lg
          border
          border-slate-200
          dark:border-slate-700
          bg-slate-100
          dark:bg-slate-800
          px-2.5
          py-1
          text-[10px]
          font-bold
          text-slate-500
          dark:text-slate-300
          select-none
          pointer-events-none
        "
      >
        <span>#</span>
        <span>K</span>
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        id={uniqueId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full
          rounded-2xl
          border
          border-slate-200
          dark:border-slate-700
          bg-white/90
          dark:bg-slate-900/90
          backdrop-blur-xl
          py-3
          pl-16
          pr-12
          text-sm
          text-slate-900
          dark:text-white
          placeholder:text-slate-400
          dark:placeholder:text-slate-500
          shadow-sm
          transition-all
          duration-300
          outline-none
          hover:border-slate-300
          dark:hover:border-slate-600
          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-500/20
          ${className}
        `}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="
            absolute
            right-3
            top-4.5
            -translate-y-1/2
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-slate-400
            hover:bg-red-50
            hover:text-red-500
            dark:hover:bg-red-950/30
            transition-all
          "
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Search Indicator */}
      {value && (
        <div className="mt-2 ml-2 text-[11px] text-slate-500 dark:text-slate-400">
          Searching for{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            "{value}"
          </span>
        </div>
      )}
    </div>
  );
}