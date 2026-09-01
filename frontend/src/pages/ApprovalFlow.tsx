import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { recommendationsApi } from '../api/intelligence';
import type { Recommendation } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';
import { AssetStatusBadge } from '../components/ui/Badge';

export function ApprovalFlow() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const recId = searchParams.get('recommendation_id');
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recommendationsApi.getAll();
      setRecommendations(data.filter(r => r.status === 'PENDING' || r.status === 'APPROVED'));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await recommendationsApi.getById(id);
      setSelectedRec(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (recId) {
      loadDetail(recId);
    } else {
      loadList();
    }
  }, [recId, loadDetail, loadList]);

  const submit = async (action: 'approve' | 'reject') => {
    if (!recId) return;
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await recommendationsApi.approve(recId, notes);
      } else {
        await recommendationsApi.reject(recId, notes);
      }
      await loadDetail(recId);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const execute = async () => {
    if (!recId) return;
    setSubmitting(true);
    try {
      await recommendationsApi.execute(recId, notes);
      setTimeout(() => navigate('/actions'), 600);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !recId && recommendations.length === 0) return <div><LoadingState /></div>;
  if (error && !recId) return <div><ErrorState error={error} onRetry={loadList} /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{recId ? 'Review Decision' : 'Approvals Queue'}</h1>
          <p className="page-subtitle">Human-in-the-loop decision on AI recommendations</p>
        </div>
        {recId && (
          <button className="btn btn-secondary" onClick={() => { setSearchParams({}); setSelectedRec(null); setNotes(''); }}>
            ← Back to Queue
          </button>
        )}
      </div>

      {!recId ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pending & Approved Recommendations ({recommendations.length})</div>
            <ProvenancePill type="DERIVED" />
          </div>
          <div className="data-table-wrapper">
            {recommendations.length === 0 ? (
               <EmptyState icon="✅" title="All caught up" message="There are no pending recommendations requiring your approval." />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Target Site</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map(r => {
                    const c = (r as any).candidate;
                    return (
                      <tr key={r.id}>
                        <td className="mono">{r.id.substring(0, 8)}…</td>
                        <td>{r.action_type}</td>
                        <td><span className="asset-id-cell">{c?.asset_id || 'N/A'}</span></td>
                        <td className="mono">{c?.target_site_id || 'N/A'}</td>
                        <td><AssetStatusBadge status={r.status} /></td>
                        <td>
                          <button
                            className={r.status === 'PENDING' ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                            onClick={() => setSearchParams({ recommendation_id: r.id })}
                          >
                            {r.status === 'PENDING' ? 'Review →' : 'View →'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : selectedRec ? (
        <div id="approval-card" className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Status: <AssetStatusBadge status={selectedRec.status} /></div>
              <div className="card-subtitle mono mt-2">ID: {selectedRec.id}</div>
            </div>
            <ProvenancePill type="DERIVED" />
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ACTION TYPE</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedRec.action_type || 'Unknown Action'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, marginBottom: 20, border: '1px solid var(--border-default)' }}>
               <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>ASSET / CANDIDATE</div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                 <div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Asset ID</div>
                   <div className="mono">{((selectedRec as any).candidate?.asset_id) || 'N/A'}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Site ID</div>
                   <div className="mono">{((selectedRec as any).candidate?.target_site_id) || 'N/A'}</div>
                 </div>
               </div>
            </div>

            {selectedRec.status === 'PENDING' && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Decision Notes (optional)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add rationale for your decision…"
                    style={{ resize: 'vertical', width: '100%' }}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => submit('approve')} disabled={submitting}>
                    Approve Request
                  </button>
                  <button className="btn btn-danger btn-lg" onClick={() => submit('reject')} disabled={submitting}>
                    Reject Request
                  </button>
                </div>
              </>
            )}

            {selectedRec.status === 'APPROVED' && (
               <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="btn btn-primary btn-lg" onClick={execute} disabled={submitting}>
                    🚀 Execute Recommendation
                  </button>
               </div>
            )}
            
            {selectedRec.status === 'REJECTED' && (
               <div className="alert-bar alert-bar-critical mt-4">
                 This recommendation has been rejected.
               </div>
            )}

            {selectedRec.status === 'EXECUTED' && (
               <div className="alert-bar alert-bar-info mt-4">
                 This recommendation has already been executed. <a onClick={() => navigate('/actions')} style={{cursor:'pointer', textDecoration: 'underline'}}>View Impact</a>.
               </div>
            )}
          </div>
        </div>
      ) : (
        <LoadingState />
      )}
    </div>
  );
}
