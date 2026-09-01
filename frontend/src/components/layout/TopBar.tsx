import { useLocation, useNavigate } from 'react-router-dom';

const BREADCRUMBS: Record<string, string> = {
  '/': 'Fleet Command Center',
  '/assets': 'Asset Dashboard',
  '/alerts': 'Alerts',
  '/utilization': 'Utilization Analytics',
  '/risk': 'Risk Dashboard',
  '/forecasting': 'Demand Forecasting',
  '/candidates': 'Allocation Candidates',
  '/recommendations': 'Recommendations',
  '/approvals': 'Approval / Rejection',
  '/rentals': 'Rental Workflow',
  '/actions': 'Action Status',
  '/impact': 'Impact',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAsset360 = location.pathname.startsWith('/assets/') && location.pathname !== '/assets';
  const assetId = isAsset360 ? location.pathname.split('/')[2] : null;
  const currentLabel = BREADCRUMBS[location.pathname] ?? (isAsset360 ? `Asset 360` : location.pathname);

  return (
    <header className="topbar" role="banner">
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <span
          style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
          onClick={() => navigate('/')}
        >
          FleetIQ
        </span>
        <span style={{ color: 'var(--text-muted)' }}>›</span>
        {isAsset360 && (
          <>
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/assets')}
            >
              Asset Dashboard
            </span>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <span className="topbar-breadcrumb-current mono">{assetId}</span>
          </>
        )}
        {!isAsset360 && (
          <span className="topbar-breadcrumb-current">{currentLabel}</span>
        )}
      </nav>

      <div className="topbar-right">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          FleetIQ v1.0 · Phase 6
        </span>
      </div>
    </header>
  );
}
