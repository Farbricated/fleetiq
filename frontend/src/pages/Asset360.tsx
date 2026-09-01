import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetsApi, operatorsApi } from '../api/assets';
import type { Asset, UsageDaily, Event, AnalyticsResult, RiskResult, Operator } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';
import { SeverityBadge, AssetStatusBadge } from '../components/ui/Badge';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import { UtilizationBar } from '../components/analytics/UtilizationBar';

type Tab = 'overview' | 'analytics' | 'risk' | 'events' | 'operations';

export function Asset360() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [usage, setUsage] = useState<UsageDaily[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opMsg, setOpMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const [a, u, ev, an, r, ops] = await Promise.all([
        assetsApi.getById(assetId),
        assetsApi.getUsage(assetId),
        assetsApi.getEvents(assetId),
        assetsApi.getAnalytics(assetId),
        assetsApi.getRisk(assetId),
        operatorsApi.getAll(),
      ]);
      setAsset(a);
      setUsage(u);
      setEvents(ev);
      setAnalytics(an);
      setRisk(r);
      setOperators(ops);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => { load(); }, [load]);

  const assignOp = async () => {
    if (!assetId || !selectedOperator) return;
    setOpMsg(null);
    try {
      await assetsApi.assignOperator(assetId, selectedOperator);
      setOpMsg(`Operator ${selectedOperator} assigned successfully.`);
      load();
    } catch (e) {
      setOpMsg(`Error: ${(e as Error).message}`);
    }
  };

  const unassignOp = async () => {
    if (!assetId) return;
    setOpMsg(null);
    try {
      await assetsApi.unassignOperator(assetId);
      setOpMsg('Operator unassigned.');
      load();
    } catch (e) {
      setOpMsg(`Error: ${(e as Error).message}`);
    }
  };

  if (loading) return <LoadingState message={`Loading ${assetId}…`} />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!asset) return <EmptyState title="Asset not found" message={`No asset with ID ${assetId}`} />;

  const isEQX1007 = assetId === 'EQX1007';
  const u = usage[0];

  const severityClass = (lvl: string) => lvl?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';

  return (
    <div>
      {/* Hero */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{assetId}</h1>
            <AssetStatusBadge status={asset.status} />
            {isEQX1007 && <span className="badge badge-critical">DEMO ASSET</span>}
          </div>
          <p className="page-subtitle">Asset 360 · Deep intelligence view</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/assets')}>
            ← Back to Assets
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/recommendations')}>
            View Recommendations →
          </button>
        </div>
      </div>

      {/* EQX1007 attention banner */}
      {isEQX1007 && analytics && (
        <div className="spotlight-banner mb-6">
          <div className="spotlight-banner-title">🔴 Primary Demo Signature — High Priority</div>
          <div className="spotlight-banner-heading">EQX1007</div>
          <div className="spotlight-banner-sub">
            Backend-calculated underutilization and risk scores displayed below. No values are hardcoded.
          </div>
          <div className="spotlight-facts">
            <div className="spotlight-fact">
              <div className="spotlight-fact-label">Underutil. Severity</div>
              <div className="spotlight-fact-value" style={{ color: 'var(--color-high)' }}>
                {analytics.underutilization_severity} · Score {analytics.underutilization_score}
              </div>
            </div>
            <div className="spotlight-fact">
              <div className="spotlight-fact-label">Risk Level</div>
              <div className="spotlight-fact-value" style={{ color: 'var(--color-critical)' }}>
                {risk?.risk_level} · Score {risk?.risk_score}
              </div>
            </div>
            <div className="spotlight-fact">
              <div className="spotlight-fact-label">Journey</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/forecasting')}>
                  Future Demand →
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/candidates')}>
                  Candidates →
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/recommendations')}>
                  Recommendation →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {(['overview', 'analytics', 'risk', 'events', 'operations'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? '📋 Overview' :
             t === 'analytics' ? '📊 Utilization' :
             t === 'risk' ? '🛡 Risk' :
             t === 'events' ? '📝 Events' :
             '⚙ Operations'}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'overview' && (
        <div className="section-grid section-grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Asset Info</div>
              <ProvenancePill type="REAL" />
            </div>
            <div className="card-body">
              {[
                ['Asset ID', assetId],
                ['Status', asset.status ?? '—'],
                ['Model ID', asset.model_id ?? '—'],
                ['Dealer ID', asset.dealer_id ?? '—'],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Latest Usage Record</div>
              <ProvenancePill type="REAL" />
            </div>
            <div className="card-body">
              {!u ? (
                <EmptyState title="No usage data" message="No usage_daily records for this asset." />
              ) : (
                <>
                  {[
                    ['Date', u.date],
                    ['Engine Hours', `${u.engine_hours ?? 0}h`],
                    ['Idle Hours', `${u.idle_hours ?? 0}h`],
                    ['Operating Days', u.operating_days ?? '—'],
                  ].map(([k, v]) => (
                    <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{String(v)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      DERIVED UTILIZATION
                    </div>
                    <UtilizationBar percent={u.derived_utilization_percent ?? 0} />
                    <div style={{ marginTop: 6 }}>
                      <ProvenancePill type="DERIVED" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Analytics */}
      {tab === 'analytics' && analytics && (
        <div>
          <div className="section-grid section-grid-2 mb-6">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Utilization Analysis</div>
                <ProvenancePill type="DERIVED" />
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                  <div className={`score-circle ${severityClass(analytics.underutilization_severity)}`}>
                    <div className="score-circle-value">{analytics.underutilization_score}</div>
                    <div className="score-circle-label">Score</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SEVERITY</div>
                    <SeverityBadge level={analytics.underutilization_severity} />
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      Model: {analytics.model_version} · {analytics.method}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>UTILIZATION %</div>
                  <UtilizationBar percent={analytics.utilization_percent} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>IDLE %</div>
                  <UtilizationBar percent={analytics.idle_percent} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Productive Hours (DERIVED)</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{analytics.productive_hours_derived}h</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Underutilization Reasons</div>
                <ProvenancePill type="DERIVED" />
              </div>
              <div className="card-body">
                {analytics.reasons.length === 0 ? (
                  <EmptyState icon="✅" title="No issues detected" />
                ) : (
                  <ul className="reason-list">
                    {analytics.reasons.map((r, i) => (
                      <li key={i} className="reason-item">
                        <div className="reason-bullet" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Risk */}
      {tab === 'risk' && risk && (
        <div className="section-grid section-grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Operational Risk Assessment</div>
              <ProvenancePill type="DERIVED" />
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                <div className={`score-circle ${severityClass(risk.risk_level)}`}>
                  <div className="score-circle-value">{risk.risk_score}</div>
                  <div className="score-circle-label">Risk</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>RISK LEVEL</div>
                  <SeverityBadge level={risk.risk_level} />
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    Model: {risk.model_version} · {risk.method}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>EXPLANATION</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {risk.explanation}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Risk Factors</div>
              <ProvenancePill type="DERIVED" />
            </div>
            <div className="card-body">
              {risk.risk_factors.length === 0 ? (
                <EmptyState icon="✅" title="No risk factors" />
              ) : (
                <ul className="reason-list">
                  {risk.risk_factors.map((f, i) => (
                    <li key={i} className="reason-item">
                      <div className="reason-bullet" style={{ background: 'var(--color-critical)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Events */}
      {tab === 'events' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Event Timeline</div>
            <ProvenancePill type="REAL" />
          </div>
          <div className="card-body">
            {events.length === 0 ? (
              <EmptyState icon="📝" title="No events" message="No events recorded for this asset yet." />
            ) : (
              <div className="event-timeline">
                {events.map((ev, i) => (
                  <div key={ev.id} className="event-timeline-item">
                    {i < events.length - 1 && <div className="event-timeline-line" />}
                    <div className="event-timeline-dot">⚡</div>
                    <div className="event-timeline-content">
                      <div className="event-timeline-type">{ev.event_type}</div>
                      <div className="event-timeline-ts">{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Operations */}
      {tab === 'operations' && (
        <div className="section-grid section-grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Assign Operator</div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" htmlFor="operator-select">Select Operator</label>
                <select
                  id="operator-select"
                  className="form-select"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.id}{op.name ? ` · ${op.name}` : ''} [{op.status}]
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  id="assign-op-btn"
                  disabled={!selectedOperator}
                  onClick={assignOp}
                >
                  Assign
                </button>
                <button
                  className="btn btn-danger"
                  id="unassign-op-btn"
                  onClick={unassignOp}
                >
                  Unassign
                </button>
              </div>
              {opMsg && (
                <div className="alert-bar alert-bar-info" style={{ marginTop: 12 }}>
                  {opMsg}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/rentals')}
                >
                  📋 Go to Rental Workflow
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/recommendations')}
                >
                  💡 View Recommendations for {assetId}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/candidates')}
                >
                  🎯 View Allocation Candidates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
