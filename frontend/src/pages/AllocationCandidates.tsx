import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { forecastsApi, recommendationsApi } from '../api/intelligence';
import type { AllocationCandidate, Forecast } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';

export function AllocationCandidates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const forecastId = searchParams.get('forecast_id');

  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [candidates, setCandidates] = useState<AllocationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await forecastsApi.getCandidates(id);
      setCandidates(data.sort((a, b) => b.score - a.score));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    forecastsApi.getAll().then(data => {
      setForecasts(data);
      if (forecastId) {
        fetchCandidates(forecastId);
      } else if (data.length > 0) {
        setSearchParams({ forecast_id: data[0].id });
      } else {
        setIsLoading(false);
      }
    }).catch(() => setIsLoading(false));
  }, [forecastId, fetchCandidates, setSearchParams]);

  const handleGenerateRecommendation = async (candidateId: string) => {
    try {
      await recommendationsApi.create(candidateId);
      navigate('/recommendations');
    } catch (err: any) {
      alert(err.message || 'Failed to generate recommendation');
    }
  };

  const handleRegenerate = async () => {
    if (!forecastId) return;
    setIsLoading(true);
    try {
      await forecastsApi.triggerCandidates(forecastId);
      await fetchCandidates(forecastId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate candidates');
      setIsLoading(false);
    }
  };

  const selectedForecast = forecasts.find(f => f.id === forecastId);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Allocation Candidates</h1>
          <p className="page-subtitle">Ranked assets available for redeployment against forecast demand</p>
        </div>
        {forecastId && (
          <button className="btn btn-secondary" onClick={handleRegenerate} disabled={isLoading}>
            ↻ Regenerate
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Target Forecast:
          </label>
          {forecasts.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No active forecasts.{' '}
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/forecasting')}>
                Go to Forecasting
              </button>
            </span>
          ) : (
            <select
              className="form-input"
              value={forecastId || ''}
              onChange={(e) => setSearchParams({ forecast_id: e.target.value })}
              style={{ minWidth: 320 }}
            >
              <option value="">Select a forecast...</option>
              {forecasts.map(f => (
                <option key={f.id} value={f.id}>
                  {f.site_id} — {f.forecast_date} (Need: {f.predicted_quantity})
                </option>
              ))}
            </select>
          )}
          {selectedForecast && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Confidence: {((selectedForecast.confidence || 0) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-bar alert-bar-critical mb-6">
          ⚠ {error}
        </div>
      )}

      {!forecastId ? (
        <EmptyState icon="🎯" title="Select a forecast" message="Choose a demand forecast above to see ranked allocation candidates." />
      ) : isLoading ? (
        <LoadingState message="Ranking candidates..." />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No candidates yet"
          message="Click Regenerate to score assets against this forecast."
        />
      ) : (
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
                  <th>Distance Penalty</th>
                  <th>Utilization Penalty</th>
                  <th>Provenance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, index) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className={`badge ${index === 0 ? 'badge-low' : 'badge-neutral'}`}
                        style={{ fontSize: 14, fontWeight: 700 }}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td>
                      <span className="asset-id-cell" onClick={() => navigate(`/assets/${c.asset_id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{c.asset_id}</span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: c.score > 80 ? 'var(--color-low)' : 'var(--text-primary)'
                      }}>
                        {c.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="mono">{c.reasoning.distance_penalty?.toFixed(1) || '0.0'}</td>
                    <td className="mono">{c.reasoning.underutilization_penalty?.toFixed(1) || '0.0'}</td>
                    <td><ProvenancePill type="DERIVED" /></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleGenerateRecommendation(c.id)}
                      >
                        Recommend →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
