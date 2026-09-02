import React from 'react';

// ── Generic Badge ──────────────────────────────────────────────
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

// ── Asset Status Badge ─────────────────────────────────────────
export function AssetStatusBadge({ status }: { status: string | null }) {
  const s = (status ?? '').toUpperCase();
  const cls =
    s === 'AVAILABLE'   ? 'badge-available' :
    s === 'RENTED'      ? 'badge-rented'    :
    s === 'MAINTENANCE' ? 'badge-warning'   :
    'badge-neutral';
  return (
    <span className={`badge ${cls}`}>
      {status ?? '—'}
    </span>
  );
}

// ── Severity Badge ─────────────────────────────────────────────
export function SeverityBadge({ severity, level }: { severity?: string | null; level?: string | null }) {
  const s = ((severity ?? level) ?? '').toUpperCase();
  const cls =
    s === 'CRITICAL' ? 'badge-critical' :
    s === 'HIGH'     ? 'badge-warning'  :
    s === 'MEDIUM'   ? 'badge-accent'   :
    s === 'LOW'      ? 'badge-success'  :
    'badge-neutral';
  return (
    <span className={`badge ${cls}`}>
      {severity ?? level ?? '—'}
    </span>
  );
}