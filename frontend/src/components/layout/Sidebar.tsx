import { NavLink, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Fleet Command Center', icon: '⚡' },
      { path: '/assets', label: 'Asset Dashboard', icon: '🏗' },
    ],
  },
  {
    label: 'Asset Intelligence',
    items: [
      { path: '/alerts', label: 'Alerts', icon: '🔔' },
      { path: '/utilization', label: 'Utilization Analytics', icon: '📊' },
      { path: '/risk', label: 'Risk Dashboard', icon: '🛡' },
    ],
  },
  {
    label: 'Decision Engine',
    items: [
      { path: '/forecasting', label: 'Demand Forecasting', icon: '🔮' },
      { path: '/candidates', label: 'Allocation Candidates', icon: '🎯' },
      { path: '/recommendations', label: 'Recommendations', icon: '💡' },
      { path: '/approvals', label: 'Approval / Rejection', icon: '✅' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/rentals', label: 'Rental Workflow', icon: '📋' },
      { path: '/actions', label: 'Action Status', icon: '⚙' },
      { path: '/impact', label: 'Impact', icon: '📈' },
    ],
  },
];

interface SidebarProps {
  apiOnline: boolean | null;
}

export function Sidebar({ apiOnline }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">FQ</div>
          <div>
            <div className="sidebar-logo-text">FleetIQ</div>
            <div className="sidebar-logo-sub">Fleet Decision Intelligence</div>
          </div>
        </div>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div className="sidebar-section" key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-api-status">
          <span
            className="sidebar-status-dot"
            style={{ background: apiOnline === false ? '#ef4444' : apiOnline === true ? '#00d4aa' : '#94a3b8' }}
          />
          API:{' '}
          {apiOnline === null
            ? 'Checking…'
            : apiOnline
            ? 'Connected'
            : 'Offline'}
        </div>
      </div>
    </aside>
  );
}
