import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMockForecasts, getMockCandidates } from '../api/intelligence';
import { ProvenancePill } from '../components/ui/ProvenancePill';

type Decision = 'APPROVED' | 'REJECTED' | null;

export function ApprovalFlow() {
  const navigate = useNavigate();
  const forecasts = getMockForecasts();
  const topForecast = forecasts[0];
  const candidates = getMockCandidates(topForecast?.id ?? '');
  const topCandidate = candidates[0];

  const [decision, setDecision] = useState<Decision>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = (action: 'APPROVED' | 'REJECTED') => {
    setDecision(action);
    setSubmitted(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Approval / Rejection</h1>
        <p className="page-subtitle">Human-in-the-loop decision on AI recommendations · Phase 9 pending</p>
      </div>

      <div className="alert-bar alert-bar-warning mb-6">
        ⚠ Phase 9 (Recommendation Engine + Action API) is not yet implemented. This UI demonstrates the approval flow contract. When available, approval actions will be sent to <code>POST /recommendation_actions</code> and recorded in the database.
      </div>

      {!submitted ? (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Pending Decision</div>
              <div className="card-subtitle">Review the recommendation below before approving or rejecting</div>
            </div>
            <ProvenancePill type="DERIVED" />
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>RECOMMENDED ACTION</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                REASSIGN {topCandidate?.asset_id ?? '—'} → Site {topForecast?.site_id ?? '—'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>EVIDENCE SUMMARY</div>
              <ul className="reason-list">
                <li className="reason-item">
                  <div className="reason-bullet" />
                  Asset {topCandidate?.asset_id}: 12h idle, 0h engine, no operator — HIGH underutilization (score 70)
                </li>
                <li className="reason-item">
                  <div className="reason-bullet" />
                  CRITICAL operational risk (score 60) — sensor anomaly detected
                </li>
                <li className="reason-item">
                  <div className="reason-bullet" style={{ background: 'var(--color-low)' }} />
                  Forecast confirms 1 Excavator needed at Site {topForecast?.site_id}
                </li>
                <li className="reason-item">
                  <div className="reason-bullet" style={{ background: 'var(--color-low)' }} />
                  Candidate rank #1 with score {topCandidate?.score}
                </li>
              </ul>
            </div>

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
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-success btn-lg"
                id="approve-btn"
                onClick={() => submit('APPROVED')}
              >
                ✅ Approve
              </button>
              <button
                className="btn btn-danger btn-lg"
                id="reject-btn"
                onClick={() => submit('REJECTED')}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 540 }}>
          <div className="card-header">
            <div className="card-title">Decision Recorded</div>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {decision === 'APPROVED' ? '✅' : '✗'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: decision === 'APPROVED' ? 'var(--color-low)' : 'var(--color-critical)', marginBottom: 8 }}>
                {decision}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Decision noted. In Phase 9, this would be written to <code>recommendation_actions</code> table.
              </div>
              {notes && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, fontStyle: 'italic' }}>
                  Notes: "{notes}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setDecision(null); setNotes(''); }}>
                  Reset
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/actions')}>
                  View Action Status →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
