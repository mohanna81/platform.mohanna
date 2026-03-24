import React from 'react';

interface InputFieldProps {
  label?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
  id?: string;
  min?: string;
  step?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  className = '',
  name,
  id,
  min,
  step,
}) => {
  const baseClasses = 'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-brand-border focus:border-brand-peach focus:ring-brand-peach';

  const colorClasses = disabled ? 'bg-gray-50 text-gray-900 placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400';

  const widthClass = fullWidth ? 'w-full' : '';
  
  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${colorClasses} ${widthClass} ${className}`;

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
      
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        className={inputClasses}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default InputField; 