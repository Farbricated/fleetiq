import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { forecastsApi, recommendationsApi } from '../api/intelligence';
import type { AllocationCandidate } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function AllocationCandidates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forecastId = searchParams.get('forecast_id');
  
  const [candidates, setCandidates] = useState<AllocationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await forecastsApi.getCandidates(id);
      setCandidates(data.sort((a, b) => b.score - a.score));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (forecastId) {
      fetchCandidates(forecastId);
    } else {
      setError('No forecast ID provided in URL');
      setIsLoading(false);
    }
  }, [forecastId]);

  const handleGenerateRecommendation = async (candidateId: string) => {
    try {
      const rec = await recommendationsApi.create(candidateId);
      navigate(`/recommendations`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate recommendation');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Allocation Candidates</h1>
          <p className="page-subtitle">Asset ranking for active demand opportunities</p>
        </div>
        {forecastId && (
          <button className="btn btn-primary" onClick={async () => {
             setIsLoading(true);
             try {
                await forecastsApi.triggerCandidates(forecastId);
                await fetchCandidates(forecastId);
             } catch (err: any) {
                setError(err.message || 'Failed to generate candidates');
                setIsLoading(false);
             }
          }} disabled={isLoading}>
            Regenerate Candidates
          </button>
        )}
      </div>

      {error && (
        <div className="alert-bar alert-bar-critical mb-6">
          ⚠ {error}
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
                <th>Distance Penalty</th>
                <th>Underutilization Penalty</th>
                <th>Provenance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No candidates found.</td>
                </tr>
              ) : (
                candidates.map((c, index) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className={`badge ${index === 0 ? 'badge-accent' : 'badge-neutral'}`}
                        style={{ fontSize: 14, fontWeight: 700 }}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td>
                      <span className="asset-id-cell" onClick={() => navigate(`/assets/${c.asset_id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{c.asset_id}</span>
                      {c.asset_id === 'EQX1007' && (
                        <span className="badge badge-critical" style={{ marginLeft: 6 }}>DEMO</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: c.score > 80 ? 'var(--accent-primary)' : 'var(--text-primary)'
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
