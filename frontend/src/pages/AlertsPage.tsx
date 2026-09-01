import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '../api/alerts';
import { dashboardApi } from '../api/dashboard';
import type { Alert } from '../types';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { SeverityBadge } from '../components/ui/Badge';
import { ProvenancePill } from '../components/ui/ProvenancePill';

type FilterType = 'ALL' | 'UNDERUTILIZATION' | 'OVERDUE_RENTAL' | 'OPERATIONAL_ANOMALY';
type FilterSeverity = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('ALL');
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertsApi.getAll();
      setAlerts(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    setScanning(true);
    setScanMsg(null);
    try {
      const [od, uu] = await Promise.all([
        dashboardApi.triggerOverdueCheck(),
        dashboardApi.triggerUnderutilizationCheck(),
      ]);
      const total = od.alerts_created + uu.alerts_created;
      setScanMsg(total > 0
        ? `✓ ${total} new alert(s) generated.`
        : '✓ Scan complete — no new alerts found.');
      load();
    } catch {
      setScanMsg('⚠ Scan failed. Is the backend running?');
    } finally {
      setScanning(false);
    }
  };

  const filtered = alerts.filter((a) => {
    const mt = filterType === 'ALL' || a.type === filterType;
    const ms = filterSeverity === 'ALL' || a.severity?.toUpperCase() === filterSeverity;
    return mt && ms;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alert Center</h1>
        <p className="page-subtitle">
          {alerts.length} total alert(s) · {alerts.filter(a => a.status === 'ACTIVE').length} active
        </p>
      </div>

      <div className="toolbar">
        <select
          className="filter-select"
          id="filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="ALL">All Types</option>
          <option value="UNDERUTILIZATION">Underutilization</option>
          <option value="OVERDUE_RENTAL">Overdue Rental</option>
          <option value="OPERATIONAL_ANOMALY">Operational Anomaly</option>
        </select>
        <select
          className="filter-select"
          id="filter-severity"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="btn btn-primary btn-sm" id="run-scan-btn" onClick={runScan} disabled={scanning}>
          {scanning ? '…Scanning' : '⚡ Run Scans'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
        <ProvenancePill type="REAL" />
      </div>

      {scanMsg && (
        <div className="alert-bar alert-bar-info mb-4">
          {scanMsg}
        </div>
      )}

      {loading && <LoadingState message="Loading alerts…" />}
      {error && <ErrorState error={error} onRetry={load} />}

      {!loading && !error && (
        filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No alerts"
            message="No alerts match the current filters. Run a scan to generate new alerts."
          />
        ) : (
          <div className="card">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} data-testid={`alert-row-${a.id}`}>
                      <td>
                        <span
                          className="asset-id-cell"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/assets/${a.asset_id}`)}
                        >
                          {a.asset_id}
                        </span>
                        {a.asset_id === 'EQX1007' && (
                          <span className="badge badge-critical" style={{ marginLeft: 6 }}>DEMO</span>
                        )}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{a.type ?? '—'}</td>
                      <td><SeverityBadge level={a.severity ?? 'LOW'} /></td>
                      <td>
                        <span className={`badge ${a.status === 'ACTIVE' ? 'badge-high' : 'badge-neutral'}`}>
                          {a.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300 }}>
                        {a.reason ?? '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/assets/${a.asset_id}`)}
                        >
                          Asset 360 →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
