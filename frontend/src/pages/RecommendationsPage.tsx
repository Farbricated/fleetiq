import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsApi } from '../api/intelligence';
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

  const handleReview = (id: string) => {
    navigate(`/approvals?recommendation_id=${id}`);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Recommendations</h1>
          <p className="page-subtitle">AI-generated asset allocation recommendations</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

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
              title="No recommendations found"
              message="Generate some from the Allocation Candidates page."
            />
          ) : (
            <div className="card">
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Asset ID</th>
                      <th>Action Type</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r) => (
                      <tr key={r.id}>
                        <td className="mono" style={{ fontSize: 11 }}>{r.id.substring(0, 8)}…</td>
                        <td><span className="asset-id-cell">{(r as any).candidate?.asset_id || '—'}</span></td>
                        <td>{r.action_type ?? '—'}</td>
                        <td>{r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}</td>
                        <td>
                          <span className={`badge ${r.status === 'PENDING' ? 'badge-medium' : r.status === 'APPROVED' ? 'badge-low' : r.status === 'REJECTED' ? 'badge-critical' : 'badge-neutral'}`}>
                            {r.status ?? '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReview(r.id)}
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
