import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex w-fit items-center justify-center rounded-lg border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none';
  
  const variants = {
    primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 hover:shadow-md focus:ring-blue-500',
    secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-500',
    danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 hover:shadow-md focus:ring-red-500',
    ghost: 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm leading-5',
    md: 'px-4 py-2 text-sm leading-5',
    lg: 'px-6 py-3 text-base leading-6'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};