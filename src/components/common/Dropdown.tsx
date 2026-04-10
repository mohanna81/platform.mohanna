'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
  id?: string;
  optionsMaxHeight?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  fullWidth = false,
  size = 'md',
  className = '',
  name,
  id,
  optionsMaxHeight = 'max-h-60',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const selectedOption = options.find(option => option.value === value);

  // Position the portal menu relative to the trigger button
  const openMenu = () => {
    if (disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuMaxH = 240; // matches max-h-60

    let top: number;
    if (spaceBelow >= Math.min(menuMaxH, options.length * 40 + 8) || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - Math.min(menuMaxH, options.length * 40 + 8) - 4;
    }

    setMenuStyle({
      position: 'fixed',
      top,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const baseClasses = 'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-200 focus:border-[#2a9d8f] focus:ring-[#2a9d8f]/20';

  const widthClass = fullWidth ? 'w-full' : '';
  const dropdownClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${widthClass} ${className}`;

  const handleOptionClick = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const menu = mounted && isOpen ? createPortal(
    <div
      ref={dropdownRef}
      style={menuStyle}
      className={`bg-white shadow-lg border border-gray-200 rounded-lg overflow-y-auto ${optionsMaxHeight}`}
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-gray-400 text-sm">No options</div>
      ) : options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={option.value === value ? 'primary' : 'outline'}
          size="sm"
          className={`w-full text-left px-4 py-2 text-sm !rounded-none !border-0 !border-b last:!border-b-0 !shadow-none !bg-transparent hover:!bg-gray-100 focus:!bg-gray-100 focus:!outline-none ${option.value === value ? '!bg-[#FBBF77] !text-[#0b1320]' : '!text-gray-900'} ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !option.disabled && handleOptionClick(option.value)}
          disabled={option.disabled}
        >
          <span className="block truncate" title={option.label}>
            {option.label}
          </span>
        </Button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} relative`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={id || name}
          name={name}
          className={dropdownClasses}
          onClick={openMenu}
          disabled={disabled}
        >
          <span className={`block truncate pr-8 ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`} title={selectedOption ? selectedOption.label : placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {menu}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Dropdown;
