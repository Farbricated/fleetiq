import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { recommendationsApi } from '../api/intelligence';
import type { Recommendation } from '../types';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import { LoadingState, ErrorState } from '../components/ui/States';

export function ApprovalFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recId = searchParams.get('recommendation_id');
  
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!recId) {
      setError('No recommendation ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getById(recId);
      setRecommendation(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [recId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (action: 'approve' | 'reject') => {
    if (!recId) return;
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await recommendationsApi.approve(recId, notes);
      } else {
        await recommendationsApi.reject(recId, notes);
      }
      await load();
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
      navigate('/actions');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div><LoadingState /></div>;
  if (error || !recommendation) return <div><ErrorState error={error || 'Recommendation not found'} onRetry={load} /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Approval / Rejection</h1>
        <p className="page-subtitle">Human-in-the-loop decision on AI recommendations</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recommendation Status: {recommendation.status}</div>
            <div className="card-subtitle">ID: {recommendation.id}</div>
          </div>
          <ProvenancePill type="DERIVED" />
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ACTION TYPE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {recommendation.action_type || 'Unknown Action'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
             <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>ASSET / CANDIDATE</div>
             <ul className="reason-list">
                <li className="reason-item">
                  Asset ID: {(recommendation as any).candidate?.asset_id || 'N/A'}
                </li>
                <li className="reason-item">
                  Target Site ID: {(recommendation as any).candidate?.target_site_id || 'N/A'}
                </li>
             </ul>
          </div>

          {recommendation.status === 'PENDING' && (
            <>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" htmlFor="approval-notes">Decision Notes (optional)</label>
                <textarea
                  id="approval-notes"
                  className="form-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add rationale for your decision…"
                  style={{ resize: 'vertical' }}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-success btn-lg"
                  id="approve-btn"
                  onClick={() => submit('approve')}
                  disabled={submitting}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-danger btn-lg"
                  id="reject-btn"
                  onClick={() => submit('reject')}
                  disabled={submitting}
                >
                  ✗ Reject
                </button>
              </div>
            </>
          )}

          {recommendation.status === 'APPROVED' && (
             <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  className="btn btn-primary btn-lg"
                  id="execute-btn"
                  onClick={execute}
                  disabled={submitting}
                >
                  🚀 Execute Recommendation
                </button>
             </div>
          )}
          
          {recommendation.status === 'REJECTED' && (
             <div style={{ color: 'var(--color-critical)', marginTop: 20 }}>
               This recommendation has been rejected.
             </div>
          )}

          {recommendation.status === 'EXECUTED' && (
             <div style={{ color: 'var(--color-low)', marginTop: 20 }}>
               This recommendation has already been executed. <a onClick={() => navigate('/actions')} style={{cursor:'pointer', textDecoration: 'underline'}}>View Impact</a>.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
