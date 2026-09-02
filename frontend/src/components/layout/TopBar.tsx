import { useLocation, useNavigate } from 'react-router-dom';

const BREADCRUMBS: Record<string, string> = {
  '/':               'Command Center',
  '/assets':         'Assets',
  '/alerts':         'Alerts',
  '/utilization':    'Utilization',
  '/risk':           'Risk',
  '/forecasting':    'Forecast',
  '/candidates':     'Allocation',
  '/recommendations':'Actions',
  '/approvals':      'Approvals',
  '/rentals':        'Rentals',
  '/actions':        'Action Status',
  '/impact':         'Impact',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAsset360 = location.pathname.startsWith('/assets/') && location.pathname !== '/assets';
  const assetId = isAsset360 ? location.pathname.split('/')[2] : null;
  const currentLabel = BREADCRUMBS[location.pathname] ?? (isAsset360 ? 'Asset 360' : location.pathname);

  return (
    <header className="topbar" role="banner">
      {/* Breadcrumb */}
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb" style={{ flex: 1 }}>
        <span
          style={{ cursor: 'pointer', color: 'var(--fleet-yellow-dark)', fontWeight: 700 }}
          onClick={() => navigate('/')}
        >
          FLEETIQ
        </span>
        <span style={{ color: 'var(--fleet-gray-light)' }}>›</span>
        {isAsset360 ? (
          <>
            <span
              style={{ cursor: 'pointer', color: 'var(--fleet-gray-mid)' }}
              onClick={() => navigate('/assets')}
            >
              ASSETS
            </span>
            <span style={{ color: 'var(--fleet-gray-light)' }}>›</span>
            <span className="topbar-breadcrumb-current mono">{assetId}</span>
          </>
        ) : (
          <span className="topbar-breadcrumb-current">{currentLabel}</span>
        )}
      </nav>

      {/* Right — fleet live indicator */}
      <div className="topbar-right">
        <div className="topbar-live-indicator">
          <span className="topbar-live-dot" />
          Fleet Status · Live
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fleet-gray-mid)' }}>
          Workspace: Default
        </span>
      </div>
    </header>
  );
}