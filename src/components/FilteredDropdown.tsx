'use client';

import { useState, useRef, useEffect } from 'react';

interface FilteredDropdownProps {
  items: { id: number | string; name: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  className?: string;
  disabled?: boolean;
  emptyOption?: boolean;
  emptyOptionLabel?: string;
  isError?: boolean;
  required?: boolean;
}

export default function FilteredDropdown({
  items,
  placeholder = 'Wybierz...',
  searchPlaceholder = 'Szukaj...',
  value,
  onChange,
  className = '',
  disabled = false,
  emptyOption = true,
  emptyOptionLabel = 'Brak',
  isError = false,
  required = false
}: FilteredDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Znajdź wybraną nazwę elementu
  const selectedItem = items.find(item => item.id === value);
  const displayValue = selectedItem ? selectedItem.name : placeholder;

  // Zamknij dropdown gdy użytkownik kliknie poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ustaw focus na pole wyszukiwania po otwarciu dropdowna
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filtruj elementy na podstawie wyszukiwanego tekstu
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: number | string | null) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  // Określenie klasy obramowania na podstawie stanu błędu
  const borderClass = isError
    ? 'border-red-500 ring-1 ring-red-500'
    : 'border-gray-300 hover:bg-gray-50';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Przycisk dropdown */}
      <button
        type="button"
        className={`w-full px-4 py-2 text-left bg-white border rounded-md shadow-sm flex justify-between items-center ${
          disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : borderClass
        }`}
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`${!selectedItem ? 'text-gray-500' : 'text-gray-900'} truncate`}>
          {displayValue} {required && !selectedItem && <span className="text-red-500">*</span>}
        </span>
        <svg
          className={`w-5 h-5 ml-2 -mr-1 text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Wskaźnik błędu */}
      {isError && (
        <div className="text-red-500 text-xs mt-1">
          To pole jest wymagane
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Pole wyszukiwania */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-300 p-2">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lista elementów */}
          <ul className="py-1 overflow-auto" role="listbox">
            {emptyOption && (
              <li 
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                  value === null ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleSelect(null)}
              >
                {emptyOptionLabel}
              </li>
            )}

            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <li
                  key={item.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                    item.id === value ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSelect(item.id)}
                  role="option"
                  aria-selected={item.id === value}
                >
                  {item.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 text-center">Brak wyników</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 