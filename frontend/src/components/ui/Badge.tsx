interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'available' | 'rented' | 'critical' | 'warning' | 'success' | 'info' | 'accent';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}