import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  padding = 'md',
  shadow = 'md',
  border = true,
  className = '',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const borderClass = border ? 'border border-gray-200 dark:border-gray-700' : '';
  
  const cardClasses = `bg-brand-bg text-white rounded-lg ${borderClass} ${shadowClasses[shadow]} ${className}`;

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className={`${paddingClasses[padding]} pb-0`}>
          {title && (
            <h3 className="text-lg font-semibold text-white dark:text-gray-100 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-brand-blue dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

export default Card; 