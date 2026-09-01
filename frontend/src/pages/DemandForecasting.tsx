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
