import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsApi } from '../api/assets';
import type { Asset, RiskResult } from '../types';
import { LoadingState, ErrorState } from '../components/ui/States';
import { SeverityBadge } from '../components/ui/Badge';
import { ProvenancePill } from '../components/ui/ProvenancePill';

interface AssetRisk {
  asset: Asset;
  risk: RiskResult;
}

export function RiskDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AssetRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assets = await assetsApi.getAll();
      const enriched = await Promise.all(
        assets.map(async (a) => {
          try {
            const r = await assetsApi.getRisk(a.id);
            return { asset: a, risk: r };
          } catch {
            return null;
          }
        })
      );
      const valid = enriched.filter(Boolean) as AssetRisk[];
      const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      valid.sort((a, b) => order.indexOf(a.risk.risk_level) - order.indexOf(b.risk.risk_level));
      setData(valid);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(
    (d) => filterLevel === 'ALL' || d.risk.risk_level === filterLevel
  );

  const counts = {
    CRITICAL: data.filter(d => d.risk.risk_level === 'CRITICAL').length,
    HIGH: data.filter(d => d.risk.risk_level === 'HIGH').length,
    MEDIUM: data.filter(d => d.risk.risk_level === 'MEDIUM').length,
    LOW: data.filter(d => d.risk.risk_level === 'LOW').length,
  };

  if (loading) return <LoadingState message="Computing risk scores…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Risk Dashboard</h1>
        <p className="page-subtitle">Operational risk assessment · Rule-based engine v1.0.0 · <ProvenancePill type="DERIVED" /></p>
      </div>

      <div className="kpi-grid mb-6">
        <div className="kpi-tile critical">
          <div className="kpi-label">Critical Risk</div>
          <div className="kpi-value critical">{counts.CRITICAL}</div>
        </div>
        <div className="kpi-tile warning">
          <div className="kpi-label">High Risk</div>
          <div className="kpi-value warning">{counts.HIGH}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Medium Risk</div>
          <div className="kpi-value">{counts.MEDIUM}</div>
        </div>
        <div className="kpi-tile success">
          <div className="kpi-label">Low Risk</div>
          <div className="kpi-value success">{counts.LOW}</div>
        </div>
      </div>

      <div className="toolbar">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
          <button
            key={f}
            id={`risk-filter-${f.toLowerCase()}`}
            className={`btn btn-sm ${filterLevel === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterLevel(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Asset Risk Scores</div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Risk Level</th>
                <th>Score</th>
                <th>Top Risk Factor</th>
                <th>Method</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ asset, risk }) => (
                <tr
                  key={asset.id}
                  className="clickable"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  data-testid={`risk-row-${asset.id}`}
                >
                  <td>
                    <span className="asset-id-cell">{asset.id}</span>
                    {asset.id === 'EQX1007' && (
                      <span className="badge badge-critical" style={{ marginLeft: 6 }}>DEMO</span>
                    )}
                  </td>
                  <td><SeverityBadge level={risk.risk_level} /></td>
                  <td className="mono">{risk.risk_score}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280 }}>
                    {risk.risk_factors[0] ?? '—'}
                  </td>
                  <td style={{ fontSize: 11 }} className="mono">{risk.method}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}`); }}
                    >
                      360 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
