import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { forecastsApi } from '../api/intelligence';
import type { Forecast } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function DemandForecasting() {
  const navigate = useNavigate();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecasts = async () => {
    setIsLoading(true);
    try {
      const data = await forecastsApi.getAll();
      setForecasts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forecasts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      await forecastsApi.generate();
      await fetchForecasts();
    } catch (err: any) {
      setError(err.message || 'Failed to generate forecasts');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Demand Forecasting</h1>
          <p className="page-subtitle">Future equipment demand predictions</p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate New Forecasts'}
        </button>
      </div>

      {error && (
        <div className="alert-bar alert-bar-critical mb-6">
          ⚠ {error}
        </div>
      )}

      {/* PREDICT beat: What-If Simulation stub */}
      <div className="card mb-6" style={{ border: '1px solid rgba(0,212,170,0.3)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">🔮 What-If Simulation</div>
            <div className="card-subtitle">Scenario: Redeploy EQX1007 to Site SITE_CONST → estimated impact</div>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 4 }}>
            ILLUSTRATIVE ESTIMATE
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Demand Gap Closed', value: '1 unit', color: 'var(--color-low)' },
              { label: 'Idle Hours Eliminated', value: '12 hrs/day', color: 'var(--accent-primary)' },
              { label: 'Est. Monthly Saving', value: '~$4,200', color: 'var(--accent-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            * Estimated from Weighted Moving Average forecast and idle-cost model. Labeled ILLUSTRATIVE ESTIMATE per provenance policy.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Forecast Queue</div>
            <div className="card-subtitle">{forecasts.length} demand events predicted</div>
          </div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Equipment Type</th>
                <th>Forecast Date</th>
                <th>Qty Needed</th>
                <th>Confidence</th>
                <th>Provenance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && forecasts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : forecasts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No forecasts found. Generate some.</td>
                </tr>
              ) : (
                forecasts.map((f) => (
                  <tr key={f.id}>
                    <td className="mono">{f.site_id}</td>
                    <td>{f.equipment_type_name || 'N/A'}</td>
                    <td className="mono">{f.forecast_date}</td>
                    <td>{f.predicted_quantity}</td>
                    <td>
                      <span style={{ color: (f.confidence || 0) > 0.75 ? 'var(--color-low)' : 'var(--color-medium)' }}>
                        {((f.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td><ProvenancePill type="DERIVED" /></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/candidates?forecast_id=${f.id}`)}
                      >
                        Find Candidates →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
