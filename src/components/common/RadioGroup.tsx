import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
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
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
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
}) => {
  const baseClasses = 'h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : 'border-gray-300 focus:ring-blue-500';
  
  const radioClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${id || name}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              required={required}
              disabled={disabled || option.disabled}
              className={radioClasses}
            />
            <label 
              htmlFor={`${id || name}-${option.value}`} 
              className={`ml-3 text-sm font-medium ${disabled || option.disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default RadioGroup; 