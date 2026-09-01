import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsApi } from '../api/intelligence';
import { getMockForecasts, getMockCandidates } from '../api/intelligence';
import type { Recommendation } from '../types';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function RecommendationsPage() {
  const navigate = useNavigate();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getAll();
      setRecs(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Mock recommendation built from mock candidates for EQX1007 demo
  const forecasts = getMockForecasts();
  const topForecast = forecasts[0];
  const candidates = getMockCandidates(topForecast?.id ?? '');
  const topCandidate = candidates[0];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Recommendations</h1>
        <p className="page-subtitle">AI-generated asset allocation recommendations</p>
      </div>

      {/* EQX1007 Demo Recommendation */}
      {topCandidate && (
        <div className="card mb-6" style={{ border: '1px solid rgba(0, 212, 170, 0.3)' }}>
          <div className="card-header" style={{ background: 'rgba(0, 212, 170, 0.05)' }}>
            <div>
              <div className="card-title" style={{ color: 'var(--accent-primary)' }}>
                💡 Primary Recommendation — EQX1007
              </div>
              <div className="card-subtitle">Highest-priority candidate for Forecast {topForecast.id}</div>
            </div>
            <ProvenancePill type="DERIVED" />
          </div>
          <div className="card-body">
            <div className="section-grid section-grid-2">
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>ACTION</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  REASSIGN
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>ASSET</div>
                <div
                  className="asset-id-cell"
                  style={{ fontSize: 20, marginBottom: 12 }}
                >
                  {topCandidate.asset_id}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>TARGET</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {topForecast.site_name} (Site {topForecast.site_id})
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CANDIDATE SCORE</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {topCandidate.score}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>EVIDENCE</div>
                <ul className="reason-list" style={{ marginBottom: 20 }}>
                  <li className="reason-item">
                    <div className="reason-bullet" style={{ background: 'var(--color-high)' }} />
                    {topCandidate.reasoning.idle_hours}h idle · {topCandidate.reasoning.engine_hours}h engine = HIGH underutilization
                  </li>
                  <li className="reason-item">
                    <div className="reason-bullet" style={{ background: 'var(--color-high)' }} />
                    No operator assigned — asset is idle with no current purpose
                  </li>
                  <li className="reason-item">
                    <div className="reason-bullet" style={{ background: 'var(--color-low)' }} />
                    Forecast confirms demand for Excavator at {topForecast.site_id}
                  </li>
                </ul>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/approvals')}>
                    ✅ Go to Approval →
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/assets/${topCandidate.asset_id}`)}>
                    View Asset 360
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}>
              <strong style={{ color: 'var(--provenance-derived)' }}>DERIVED</strong> — This recommendation is computed
              from the analytics engine (underutilization score, risk score, candidate ranking).
              The specific action ("REASSIGN to {topForecast.site_id}") is calculated by the backend allocation engine,
              not hardcoded. No real ML model is used — rule-based v1.0.0.
            </div>
          </div>
        </div>
      )}

      {/* Real backend recommendations */}
      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <div className="card-header" style={{ marginBottom: 8 }}>
            <div className="card-title">Backend Recommendations ({recs.length})</div>
          </div>
          {recs.length === 0 ? (
            <EmptyState
              icon="💡"
              title="No backend recommendations"
              message="The /recommendations endpoint returned empty. Phase 9 backend will populate this."
            />
          ) : (
            <div className="card">
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Action Type</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r) => (
                      <tr key={r.id}>
                        <td className="mono" style={{ fontSize: 11 }}>{r.id.substring(0, 12)}…</td>
                        <td>{r.action_type ?? '—'}</td>
                        <td>{r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}</td>
                        <td>
                          <span className={`badge ${r.status === 'PENDING' ? 'badge-medium' : 'badge-neutral'}`}>
                            {r.status ?? '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/approvals')}
                          >
                            Review →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
