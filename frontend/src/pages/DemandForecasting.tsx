import { useNavigate } from 'react-router-dom';
import { getMockForecasts } from '../api/intelligence';
import type { MockForecast } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function DemandForecasting() {
  const navigate = useNavigate();
  const forecasts: MockForecast[] = getMockForecasts();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Demand Forecasting</h1>
        <p className="page-subtitle">Future equipment demand predictions · Phase 7 pending</p>
      </div>

      <div className="alert-bar alert-bar-warning mb-6">
        ⚠ Phase 7 (ML demand forecasting) is not yet implemented by the backend team. The data below is <strong>SIMULATED</strong> to demonstrate the UI contract. When Phase 7 lands, replace <code>getMockForecasts()</code> in <code>src/api/intelligence.ts</code> with the real <code>/forecasts</code> endpoint.
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Forecast Queue</div>
            <div className="card-subtitle">{forecasts.length} demand events predicted</div>
          </div>
          <ProvenancePill type="SIMULATED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Equipment Type</th>
                <th>Forecast Date</th>
                <th>Qty Needed</th>
                <th>Confidence</th>
                <th>Provenance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => (
                <tr key={f.id}>
                  <td className="mono">{f.site_id}</td>
                  <td>{f.site_name}</td>
                  <td className="mono">{f.forecast_date}</td>
                  <td>{f.predicted_quantity}</td>
                  <td>
                    <span style={{ color: f.confidence > 0.75 ? 'var(--color-low)' : 'var(--color-medium)' }}>
                      {(f.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td><ProvenancePill type="SIMULATED" /></td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('/candidates')}
                    >
                      Find Candidates →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--provenance-simulated)' }}>SIMULATED</strong> — These forecast values are illustrative mock data generated in <code>src/api/intelligence.ts</code>.
          They are NOT derived from real operational data or trained ML models. They exist solely to demonstrate the UI contract
          for Phase 7. The backend implementation will replace this with real demand signal analysis.
        </div>
      </div>
    </div>
  );
}
