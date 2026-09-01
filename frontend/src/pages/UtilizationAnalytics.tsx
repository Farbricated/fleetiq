import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsApi } from '../api/assets';
import { dashboardApi } from '../api/dashboard';
import type { Asset, FleetAnalyticsSummary } from '../types';
import { LoadingState, ErrorState } from '../components/ui/States';
import { UtilizationBar } from '../components/analytics/UtilizationBar';
import { SeverityBadge } from '../components/ui/Badge';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';

interface AssetWithAnalytics {
  asset: Asset;
  utilizationPercent: number;
  severity: string;
  score: string;
  reasons: string[];
}

export function UtilizationAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<AssetWithAnalytics[]>([]);
  const [fleet, setFleet] = useState<FleetAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assets, fleetStats] = await Promise.all([
        assetsApi.getAll(),
        dashboardApi.getFleetAnalytics(),
      ]);
      setFleet(fleetStats);

      const enriched = await Promise.all(
        assets.map(async (a) => {
          try {
            const an = await assetsApi.getAnalytics(a.id);
            return {
              asset: a,
              utilizationPercent: an.utilization_percent,
              severity: an.underutilization_severity,
              score: an.underutilization_score,
              reasons: an.reasons,
            };
          } catch {
            return {
              asset: a,
              utilizationPercent: 0,
              severity: 'LOW',
              score: '0',
              reasons: ['No usage data'],
            };
          }
        })
      );
      setData(enriched.sort((a, b) => a.utilizationPercent - b.utilizationPercent));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading utilization analytics…" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const chartData = data.map((d) => ({
    id: d.asset.id,
    util: parseFloat(d.utilizationPercent.toFixed(1)),
    fill:
      d.utilizationPercent === 0 ? '#ef4444' :
      d.utilizationPercent < 30 ? '#f97316' :
      d.utilizationPercent < 60 ? '#eab308' : '#22c55e',
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Utilization Analytics</h1>
        <p className="page-subtitle">Per-asset utilization breakdown · Rule-based analytics engine v1.0.0</p>
      </div>

      {fleet && (
        <div className="kpi-grid mb-6">
          <div className="kpi-tile info">
            <div className="kpi-label">Fleet Avg. Utilization</div>
            <div className="kpi-value accent">{fleet.average_utilization.toFixed(1)}%</div>
          </div>
          <div className="kpi-tile warning">
            <div className="kpi-label">Underutilized</div>
            <div className="kpi-value warning">{fleet.underutilized_assets}</div>
          </div>
          <div className="kpi-tile critical">
            <div className="kpi-label">High Risk</div>
            <div className="kpi-value critical">{fleet.high_risk_assets}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Total Assets</div>
            <div className="kpi-value">{fleet.total_assets}</div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">Utilization % by Asset</div>
            <div className="card-subtitle">Lower = more underutilized</div>
          </div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: -10 }}>
              <XAxis
                dataKey="id"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
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
                formatter={(v: number) => [`${v}%`, 'Utilization']}
              />
              <Bar dataKey="util" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Per-Asset Utilization Table</div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Utilization %</th>
                <th>Underutil. Score</th>
                <th>Severity</th>
                <th>Top Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr
                  key={d.asset.id}
                  className="clickable"
                  onClick={() => navigate(`/assets/${d.asset.id}`)}
                >
                  <td>
                    <span className="asset-id-cell">{d.asset.id}</span>
                    {d.asset.id === 'EQX1007' && (
                      <span className="badge badge-critical" style={{ marginLeft: 6 }}>DEMO</span>
                    )}
                  </td>
                  <td>
                    <UtilizationBar percent={d.utilizationPercent} />
                  </td>
                  <td className="mono">{d.score}</td>
                  <td><SeverityBadge level={d.severity} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>
                    {d.reasons[0] ?? '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/assets/${d.asset.id}`); }}
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
