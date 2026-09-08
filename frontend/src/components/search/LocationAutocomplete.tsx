"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchLocationSuggestions, LocationSuggestion } from "@/lib/api";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  iconColor?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSelectSuggestion,
  iconColor = "text-sky-400",
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search query handler
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await fetchLocationSuggestions(value);
      setSuggestions(results);
      setLoading(false);
      if (results.length > 0) {
        setIsOpen(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: LocationSuggestion) => {
    onChange(item.display_name);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative flex items-center">
        <MapPin className={`w-4 h-4 absolute left-3.5 ${iconColor} pointer-events-none`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-inner"
        />
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3 text-slate-400 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/60 font-sans">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3.5 py-2.5 hover:bg-slate-800/80 cursor-pointer transition flex items-start gap-2.5 text-xs text-slate-200"
            >
              <Search className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-slate-100">{item.display_name}</p>
                {item.city && (
                  <p className="text-[11px] text-slate-400 capitalize">{item.type || "location"} • {item.city}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
