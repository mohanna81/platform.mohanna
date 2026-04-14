'use client';
import React, { useState, useEffect } from 'react';

interface TimePickerProps {
  label?: string;
  value: string; // HH:mm 24-hour
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

function to12h(value: string): { display: string; period: 'AM' | 'PM' } {
  if (!value) return { display: '', period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { display: `${h12}:${String(m).padStart(2, '0')}`, period };
}

function to24h(display: string, period: 'AM' | 'PM'): string | null {
  const match = display.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2] || '0');
  if (h < 1 || h > 12 || m > 59) return null;
  if (period === 'AM') h = h === 12 ? 0 : h;
  else h = h === 12 ? 12 : h + 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  fullWidth = false,
  placeholder = '12:00',
}) => {
  const parsed = to12h(value);
  const [display, setDisplay] = useState(parsed.display);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

  useEffect(() => {
    const p = to12h(value);
    setDisplay(p.display);
    setPeriod(p.period);
  }, [value]);

  const commit = (d: string, p: 'AM' | 'PM') => {
    const result = to24h(d, p);
    if (result) onChange(result);
  };

  const handleBlur = () => commit(display, period);

  const handlePeriod = (p: 'AM' | 'PM') => {
    setPeriod(p);
    commit(display, p);
  };

  const borderClass = error
    ? 'border-red-300 focus-within:border-red-400'
    : 'border-gray-200 focus-within:border-[#2a9d8f] focus-within:ring-2 focus-within:ring-[#2a9d8f]/20';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`flex items-center border rounded-lg bg-white transition-all duration-200 overflow-hidden ${borderClass} ${disabled ? 'opacity-50' : ''}`}>
        {/* Clock icon */}
        <svg className="w-4 h-4 text-[#2a9d8f] ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        {/* Time input — numbers only, colon auto-inserted */}
        <input
          type="text"
          value={display}
          onChange={e => {
            // Strip non-digits
            const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
            // Auto-insert colon after 2 digits
            const formatted = digits.length >= 3
              ? `${digits.slice(0, 2)}:${digits.slice(2)}`
              : digits;
            setDisplay(formatted);
          }}
          onBlur={handleBlur}
          onKeyDown={e => e.key === 'Enter' && handleBlur()}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          inputMode="numeric"
          maxLength={5}
          className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
        />

        {/* AM / PM toggle */}
        <div className="flex items-center gap-0.5 mr-1.5">
          {(['AM', 'PM'] as const).map(p => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => handlePeriod(p)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                period === p
                  ? 'bg-[#2a9d8f] text-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TimePicker;
