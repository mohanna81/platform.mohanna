import React from 'react';

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
  id?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked = false,
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
  const baseClasses = 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : 'border-gray-300 focus:ring-blue-500';
  
  const checkboxClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id || name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            required={required}
            disabled={disabled}
            className={checkboxClasses}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label 
              htmlFor={id || name} 
              className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Checkbox; 