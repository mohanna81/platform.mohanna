import React from 'react';

interface TextAreaProps {
  label?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rows?: number;
  maxLength?: number;
  className?: string;
  name?: string;
  id?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  rows = 4,
  maxLength,
  className = '',
  name,
  id,
}) => {
  const baseClasses = 'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-200 focus:border-[#2a9d8f] focus:ring-[#2a9d8f]/20';

  const widthClass = fullWidth ? 'w-full' : '';
  
  const colorClasses = 'bg-white text-gray-900 placeholder-gray-400';
  const textareaClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${colorClasses} ${widthClass} ${className}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id || name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      
      {maxLength && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {(value?.length || 0)} / {maxLength}
        </p>
      )}
    </div>
  );
};

export default TextArea; 