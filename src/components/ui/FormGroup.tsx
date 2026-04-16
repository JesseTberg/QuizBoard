import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormGroup({ label, error, children, className, ...props }: FormGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
