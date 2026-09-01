import type { SeverityLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: SeverityLevel | 'neutral' | 'info' | 'accent' | 'available' | 'rented' | 'maintenance';
  className?: string;
}

const variantMap: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
  neutral: 'badge-neutral',
  info: 'badge-info',
  accent: 'badge-accent',
  available: 'badge-available',
  rented: 'badge-rented',
  maintenance: 'badge-maintenance',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantMap[variant] ?? 'badge-neutral'} ${className}`}>
      {children}
    </span>
  );
}

export function SeverityBadge({ level }: { level: string }) {
  const v = level?.toUpperCase() as SeverityLevel;
  return <Badge variant={v}>{level}</Badge>;
}

export function AssetStatusBadge({ status }: { status: string | null }) {
  const s = status?.toUpperCase() ?? 'UNKNOWN';
  const v = s === 'AVAILABLE' ? 'available' : s === 'RENTED' ? 'rented' : s === 'MAINTENANCE' ? 'maintenance' : 'neutral';
  return <Badge variant={v as 'available' | 'rented' | 'maintenance' | 'neutral'}>{status ?? '—'}</Badge>;
}
