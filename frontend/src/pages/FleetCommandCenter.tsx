import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { assetsApi } from '../api/assets';
import type { DashboardSummary, FleetAnalyticsSummary } from '../types';
import { LoadingState, ErrorState } from '../components/ui/States';
import { FLEET_HERO_IMAGE } from '../utils/machineImages';
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
    { name: 'Available', count: summary.available_assets, color: '#16A34A' },
    { name: 'Rented',    count: summary.rented_assets,    color: '#1D4ED8' },
    { name: 'Underutil.', count: fleet.underutilized_assets, color: '#D97706' },
    { name: 'High Risk', count: fleet.high_risk_assets,  color: '#DC2626' },
    { name: 'Overdue',   count: summary.overdue_assets,  color: '#991B1B' },
  ];

  return (
    <div className="page-fade-in">

      {/* Hero banner */}
      <div style={{
        position: 'relative', height: 180, borderRadius: 'var(--radius-md)',
        overflow: 'hidden', marginBottom: 24,
        background: 'var(--fleet-charcoal)',
      }}>
        <img
          src={FLEET_HERO_IMAGE}
          alt="Fleet operations"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 32px',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1 }}>
            Command Center
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 6, fontWeight: 600 }}>
            Fleet Operations · {summary.total_assets} Assets Tracked · Real-Time
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block', animation: 'pulse-live 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16A34A' }}>Live Data Feed Active</span>
          </div>
        </div>
        {/* Yellow accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'var(--fleet-yellow)' }} />
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
                  tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600, fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1D',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: '#F9FAFB',
                    fontSize: 12,
                    fontFamily: 'Inter',
                  }}
                  cursor={{ fill: 'rgba(255,205,17,0.05)' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
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

