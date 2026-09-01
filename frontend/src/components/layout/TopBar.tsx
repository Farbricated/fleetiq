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

  const getActiveBeat = (pathname: string) => {
    if (pathname.includes('/assets') && !isAsset360) return 0; // SPOT
    if (isAsset360) return 1; // EXPLAIN
    if (pathname.includes('/recommendations') || pathname.includes('/approvals')) return 2; // ACT
    if (pathname.includes('/forecasting') || pathname.includes('/candidates')) return 3; // PREDICT
    if (pathname.includes('/impact') || pathname.includes('/actions')) return 4; // PROVE
    return -1;
  };

  const activeBeat = getActiveBeat(location.pathname);
  const beats = ["SPOT", "EXPLAIN", "ACT", "PREDICT", "PROVE"];

  return (
    <header className="topbar" role="banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb" style={{ flex: 1 }}>
        <span
          style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
          onClick={() => navigate('/')}
        >
          FleetIQ
        </span>
        <span style={{ color: 'var(--text-muted)' }}>›</span>
        {isAsset360 ? (
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
        ) : (
          <span className="topbar-breadcrumb-current">{currentLabel}</span>
        )}
      </nav>

      {/* 5-Beat Story Progress */}
      {activeBeat >= 0 && (
        <div className="demo-story-indicator" style={{ display: 'flex', gap: '8px', flex: 2, justifyContent: 'center' }}>
          {beats.map((beat, idx) => (
            <div key={beat} style={{ 
              display: 'flex', 
              alignItems: 'center',
              opacity: idx === activeBeat ? 1 : 0.4,
              fontWeight: idx === activeBeat ? 700 : 400,
              color: idx === activeBeat ? 'var(--accent-primary)' : 'var(--text-primary)'
            }}>
              <span style={{ 
                width: 18, height: 18, borderRadius: '50%', 
                backgroundColor: idx === activeBeat ? 'var(--accent-primary)' : 'var(--bg-elevated)', 
                color: idx === activeBeat ? '#000' : 'inherit',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, marginRight: 6 
              }}>{idx + 1}</span>
              <span style={{ fontSize: 12 }}>{beat}</span>
              {idx < beats.length - 1 && <span style={{ marginLeft: 8, opacity: 0.5 }}>→</span>}
            </div>
          ))}
        </div>
      )}

      <div className="topbar-right" style={{ flex: 1, textAlign: 'right' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Demo Edition · {activeBeat >= 0 ? `Beat ${activeBeat + 1}` : 'Phase 6'}
        </span>
      </div>
    </header>
  );
}
