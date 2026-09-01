import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { assetsApi } from '../api/assets';
import type { DashboardSummary, FleetAnalyticsSummary } from '../types';
import { LoadingState, ErrorState } from '../components/ui/States';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export function FleetCommandCenter() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [fleet, setFleet] = useState<FleetAnalyticsSummary | null>(null);
  const [assets, setAssets] = useState<{ id: string; status: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, f, a] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getFleetAnalytics(),
        assetsApi.getAll(),
      ]);
      setSummary(s);
      setFleet(f);
      setAssets(a);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    setScanMsg(null);
    try {
      const [od, uu] = await Promise.all([
        dashboardApi.triggerOverdueCheck(),
        dashboardApi.triggerUnderutilizationCheck(),
      ]);
      setScanMsg(`Scan complete: ${od.alerts_created + uu.alerts_created} new alert(s) generated.`);
      load();
    } catch {
      setScanMsg('Scan failed — is the backend running?');
    }
  };

  if (loading) return <LoadingState message="Loading fleet data…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!summary || !fleet) return null;

  const kpiTiles = [
    { label: 'Total Assets', value: summary.total_assets, cls: 'info' },
    { label: 'Active Rentals', value: summary.active_rentals, cls: 'info' },
    { label: 'Available', value: summary.available_assets, cls: 'success' },
    { label: 'Rented', value: summary.rented_assets, cls: '' },
    { label: 'Overdue', value: summary.overdue_assets, cls: summary.overdue_assets > 0 ? 'critical' : 'success' },
    { label: 'Underutilized', value: fleet.underutilized_assets, cls: fleet.underutilized_assets > 0 ? 'warning' : 'success' },
    { label: 'High Risk', value: fleet.high_risk_assets, cls: fleet.high_risk_assets > 0 ? 'critical' : 'success' },
    { label: 'Active Alerts', value: summary.active_alerts, cls: summary.active_alerts > 0 ? 'warning' : 'success' },
  ];

  const statusData = [
    { name: 'Available', count: summary.available_assets, color: '#22c55e' },
    { name: 'Rented', count: summary.rented_assets, color: '#0ea5e9' },
    { name: 'Underutil.', count: fleet.underutilized_assets, color: '#f97316' },
    { name: 'High Risk', count: fleet.high_risk_assets, color: '#ef4444' },
    { name: 'Overdue', count: summary.overdue_assets, color: '#dc2626' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fleet Command Center</h1>
        <p className="page-subtitle">
          Real-time overview of your entire fleet · {summary.total_assets} assets tracked
        </p>
      </div>



      {/* Hero Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-hero-card">
          <div className="stat-hero-value">{summary.total_assets}</div>
          <div className="stat-hero-label">Total Assets</div>
        </div>
        <div className="stat-hero-card" style={{ borderTopColor: 'var(--color-critical)' }}>
          <div className="stat-hero-value">
            {fleet.idle_assets > 0 && <span className="pulse-dot"></span>}
            {fleet.idle_assets}
          </div>
          <div className="stat-hero-label">Idle Assets</div>
        </div>
        <div className="stat-hero-card" style={{ borderTopColor: fleet.average_utilization < 30 ? 'var(--color-critical)' : 'var(--accent-primary)' }}>
          <div className="stat-hero-value">{fleet.average_utilization.toFixed(1)}%</div>
          <div className="stat-hero-label">Avg Utilization</div>
        </div>
        <div className="stat-hero-card" style={{ borderTopColor: fleet.high_risk_assets > 0 ? 'var(--color-critical)' : 'var(--accent-primary)' }}>
          <div className="stat-hero-value">
            {fleet.high_risk_assets > 0 && <span className="pulse-dot"></span>}
            {fleet.high_risk_assets}
          </div>
          <div className="stat-hero-label">High Risk Assets</div>
        </div>
      </div>

      <div className="section-grid section-grid-2-1 mb-6">
        {/* Fleet Status Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Fleet Status Distribution</div>
              <div className="card-subtitle">Assets by status category · REAL data</div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} margin={{ left: -10 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a2235',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(148,163,184,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Health */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Health</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>AVG UTILIZATION</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fleet.average_utilization.toFixed(1)}%
                </div>
                <div
                  className="util-bar-track"
                  style={{ marginTop: 8 }}
                >
                  <div
                    className={`util-bar-fill ${fleet.average_utilization < 30 ? 'util-bar-low' : fleet.average_utilization < 60 ? 'util-bar-medium' : 'util-bar-good'}`}
                    style={{ width: `${fleet.average_utilization}%` }}
                  />
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
              {[
                ['Underutilized', fleet.underutilized_assets, fleet.underutilized_assets > 0],
                ['High Risk', fleet.high_risk_assets, fleet.high_risk_assets > 0],
                ['Overdue', fleet.overdue_assets, fleet.overdue_assets > 0],
                ['Anomalies', fleet.anomaly_count, false],
              ].map(([label, val, warn]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: warn ? 'var(--color-high)' : 'var(--text-primary)' }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Asset table quick view */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">All Assets</div>
            <div className="card-subtitle">Click any asset to open Asset 360</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/assets')}>
            View All →
          </button>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr
                  key={a.id}
                  className="clickable"
                  onClick={() => navigate(`/assets/${a.id}`)}
                >
                  <td className="asset-id-cell">{a.id}</td>
                  <td>
                    <span
                      className={`badge badge-${(a.status ?? '').toLowerCase() === 'available' ? 'available' : (a.status ?? '').toLowerCase() === 'rented' ? 'rented' : 'neutral'}`}
                    >
                      {a.status ?? '—'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/assets/${a.id}`); }}
                    >
                      View 360 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System scan */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">System Intelligence Scans</div>
            <div className="card-subtitle">Manually trigger anomaly detection engines</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" id="run-scan-btn" onClick={runScan}>
              ⚡ Run All Scans
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Triggers overdue detection + underutilization engine
            </span>
          </div>
          {scanMsg && (
            <div className="alert-bar alert-bar-info" style={{ marginTop: 12 }}>
              ✓ {scanMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

