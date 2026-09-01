import { useNavigate } from 'react-router-dom';
import { getMockForecasts, getMockCandidates } from '../api/intelligence';
import type { MockForecast, AllocationCandidate } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function AllocationCandidates() {
  const navigate = useNavigate();
  const forecasts: MockForecast[] = getMockForecasts();
  const topForecast = forecasts[0];
  const candidates: AllocationCandidate[] = getMockCandidates(topForecast?.id ?? '');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Allocation Candidates</h1>
        <p className="page-subtitle">Asset ranking for active demand opportunities · Phase 8 pending</p>
      </div>

      <div className="alert-bar alert-bar-warning mb-6">
        ⚠ Phase 8 (Allocation Candidates Engine) is not yet implemented by the backend team. The rankings below are <strong>DERIVED</strong> mock scores based on the analytics rules. Replace <code>getMockCandidates()</code> with the real API when available.
      </div>

      {topForecast && (
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <div className="card-title">Evaluating Forecast: {topForecast.id}</div>
              <div className="card-subtitle">
                {topForecast.site_name} · {topForecast.equipment_type} · {topForecast.forecast_date}
              </div>
            </div>
            <ProvenancePill type="SIMULATED" />
          </div>
          <div className="card-body">
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {topForecast.predicted_quantity} unit(s) of {topForecast.equipment_type} needed.
              Confidence: {(topForecast.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Ranked Candidates</div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Asset ID</th>
                <th>Score</th>
                <th>Idle Hours</th>
                <th>Engine Hours</th>
                <th>Operator Gap</th>
                <th>Provenance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span
                      className={`badge ${c.rank === 1 ? 'badge-accent' : 'badge-neutral'}`}
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      #{c.rank}
                    </span>
                  </td>
                  <td>
                    <span className="asset-id-cell">{c.asset_id}</span>
                    {c.asset_id === 'EQX1007' && (
                      <span className="badge badge-critical" style={{ marginLeft: 6 }}>DEMO</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: c.score > 80 ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}>
                      {c.score}
                    </span>
                  </td>
                  <td className="mono">{c.reasoning.idle_hours}h</td>
                  <td className="mono">{c.reasoning.engine_hours}h</td>
                  <td>
                    <span className={`badge ${c.reasoning.operator_gap === 'UNASSIGNED' ? 'badge-high' : 'badge-neutral'}`}>
                      {String(c.reasoning.operator_gap)}
                    </span>
                  </td>
                  <td><ProvenancePill type="DERIVED" /></td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/assets/${c.asset_id}`)}
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

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={() => navigate('/recommendations')}>
          View Recommendation → 
        </button>
      </div>
    </div>
  );
}
