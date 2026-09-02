import { NavLink, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/',          label: 'Command Center',      icon: '⚡' },
      { path: '/assets',    label: 'Assets',              icon: '🏗' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/alerts',      label: 'Alerts',            icon: '🔔' },
      { path: '/utilization', label: 'Utilization',       icon: '📊' },
      { path: '/risk',        label: 'Risk',              icon: '🛡' },
      { path: '/forecasting', label: 'Forecast',          icon: '🔮' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/candidates',     label: 'Allocation',     icon: '🎯' },
      { path: '/recommendations',label: 'Actions',        icon: '💡' },
      { path: '/approvals',      label: 'Approvals',      icon: '✅' },
      { path: '/rentals',        label: 'Rentals',        icon: '📋' },
      { path: '/impact',         label: 'Impact',         icon: '📈' },
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
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">FQ</div>
          <div>
            <div className="sidebar-logo-text">FleetIQ</div>
            <div className="sidebar-logo-sub">Fleet Decision Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
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

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-api-status">
          <span
            className="sidebar-status-dot"
            style={{
              background:
                apiOnline === false ? '#DC2626'
                : apiOnline === true  ? '#16A34A'
                : '#6B7280',
            }}
          />
          {apiOnline === null ? 'Connecting…' : apiOnline ? 'API Connected' : 'API Offline'}
        </div>
      </div>
    </aside>
  );
}