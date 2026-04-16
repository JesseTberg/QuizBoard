import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'category' | 'question' | 'player';
  active?: boolean;
  answered?: boolean;
  error?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'surface', active, answered, error, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card-base',
          `card-${variant}`,
          active && `card-${variant}-active`,
          answered && `card-${variant}-answered`,
          error && 'card-error',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
