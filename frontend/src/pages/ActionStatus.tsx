import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsApi } from '../api/intelligence';
import type { Recommendation } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';

export function ActionStatus() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getAll();
      const relevant = data.filter(r => r.status !== 'PENDING');
      setActions(relevant);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Action Status</h1>
          <p className="page-subtitle">Pending and completed actions from approved recommendations</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={load} />}
      {!loading && !error && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Action Log ({actions.length})</div>
          </div>
          {actions.length === 0 ? (
            <EmptyState title="No actions recorded" message="No recommendations have been approved or rejected yet." icon="📋" />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action ID</th>
                    <th>Action Type</th>
                    <th>Decision</th>
                    <th>Execution Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{a.id.substring(0,8)}…</td>
                      <td>{a.action_type || 'Unknown'}</td>
                      <td>
                        <span className={`badge ${a.status === 'REJECTED' ? 'badge-critical' : 'badge-low'}`}>
                          {a.status === 'REJECTED' ? 'REJECTED' : 'APPROVED'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'EXECUTED' ? 'badge-low' : a.status === 'REJECTED' ? 'badge-neutral' : 'badge-medium'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/impact')}
                          disabled={a.status !== 'EXECUTED'}
                        >
                          View Impact →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
