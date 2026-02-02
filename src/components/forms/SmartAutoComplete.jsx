import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

/**
 * Smart AutoComplete
 * Suggestions with filtering and keyboard navigation
 */

export default function SmartAutoComplete({
  value = '',
  onChange,
  onSelect,
  suggestions = [],
  placeholder = 'Suchen...',
  disabled = false,
  loading = false,
  minChars = 1,
  maxItems = 10,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter suggestions
  const filtered = suggestions
    .filter(item => 
      item.label.toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, maxItems);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => i < filtered.length - 1 ? i + 1 : 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => i > 0 ? i - 1 : filtered.length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filtered[selectedIndex]) {
            handleSelect(filtered[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        default:
          break;
      }
    };

    inputRef.current?.addEventListener('keydown', handleKeyDown);
    return () => inputRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-index]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    onChange(item.label);
    onSelect?.(item);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const shouldShowSuggestions = isOpen && value.length >= minChars && filtered.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(e.target.value.length >= minChars);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(value.length >= minChars)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {shouldShowSuggestions && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {loading ? (
              <div className="p-3 text-sm text-gray-500">Laden...</div>
            ) : (
              filtered.map((item, index) => (
                <motion.button
                  key={index}
                  data-index={index}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    index === selectedIndex
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  {item.label}
                  {item.description && (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  )}
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}