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
      <label className="block text-xs font-semibold text-fuchsia-200 uppercase tracking-wider mb-1.5">
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
          className="w-full bg-[#150b26]/70 border border-[#d946ef]/25 rounded-xl pl-10 pr-9 py-2.5 text-sm text-fuchsia-50 placeholder-fuchsia-300/40 focus:outline-none focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493]/40 focus:shadow-[0_0_15px_rgba(255,20,147,0.3)] transition-all duration-200"
        />
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3 text-[#ff1493] animate-spin pointer-events-none" />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 bg-[#150b26]/95 backdrop-blur-xl border border-[#d946ef]/30 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-[#d946ef]/15 font-sans">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3.5 py-2.5 hover:bg-[#a855f7]/20 hover:text-white cursor-pointer transition flex items-start gap-2.5 text-xs text-fuchsia-100"
            >
              <Search className="w-3.5 h-3.5 text-[#ff1493] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white">{item.display_name}</p>
                {item.city && (
                  <p className="text-[11px] text-fuchsia-300/70 capitalize">{item.type || "location"} • {item.city}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
