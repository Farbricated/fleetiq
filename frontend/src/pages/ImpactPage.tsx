import { ProvenancePill } from '../components/ui/ProvenancePill';

const ILLUSTRATIVE_IMPACTS = [
  {
    id: 'imp-001',
    asset: 'EQX1007',
    action: 'REASSIGN to S003',
    metric: 'Idle Hours Reduction',
    estimated_value: 12,
    actual_value: null,
    unit: 'hours/day',
    is_illustrative: true,
  },
  {
    id: 'imp-002',
    asset: 'EQX1007',
    action: 'REASSIGN to S003',
    metric: 'Revenue Recovery (Estimated)',
    estimated_value: 960,
    actual_value: null,
    unit: 'USD / day',
    is_illustrative: true,
  },
  {
    id: 'imp-003',
    asset: 'EQX1007',
    action: 'REASSIGN to S003',
    metric: 'Utilization Improvement',
    estimated_value: 75,
    actual_value: null,
    unit: '%',
    is_illustrative: true,
  },
];

export function ImpactPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Impact</h1>
        <p className="page-subtitle">Estimated business outcomes from approved actions</p>
      </div>

      <div className="alert-bar alert-bar-warning mb-6">
        ⚠ All values below are <strong>ILLUSTRATIVE ESTIMATES</strong>. They are not derived from real operational data, real rates, or real outcomes. They exist solely to demonstrate the impact measurement framework. Phase 9+ will replace these with <code>impact_records</code> from the database when real post-action data is available.
      </div>

      <div className="kpi-grid mb-6">
        {ILLUSTRATIVE_IMPACTS.map((imp) => (
          <div className="kpi-tile" key={imp.id}>
            <div className="kpi-label">{imp.metric}</div>
            <div className="kpi-value accent">
              {imp.metric.includes('Revenue') ? '$' : ''}{imp.estimated_value}{imp.unit.includes('%') ? '%' : ''}
            </div>
            <div style={{ marginTop: 8 }}>
              <ProvenancePill type="ILLUSTRATIVE ESTIMATE" />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Impact Records — EQX1007 Reassignment</div>
            <div className="card-subtitle">Asset: EQX1007 · Action: REASSIGN to S003</div>
          </div>
          <ProvenancePill type="ILLUSTRATIVE ESTIMATE" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Estimated Value</th>
                <th>Actual Value</th>
                <th>Unit</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {ILLUSTRATIVE_IMPACTS.map((imp) => (
                <tr key={imp.id}>
                  <td>{imp.metric}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {imp.estimated_value}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {imp.actual_value ?? 'Pending'}
                  </td>
                  <td className="mono">{imp.unit}</td>
                  <td><ProvenancePill type="ILLUSTRATIVE ESTIMATE" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        marginTop: 20,
        padding: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--provenance-illustrative)', fontSize: 13 }}>
          ILLUSTRATIVE ESTIMATE — Important Disclaimer
        </strong>
        <br />
        The values above are placeholder estimates for demonstration purposes only. No real rental rates,
        actual idle-hour costs, or confirmed post-action measurements have been used. The schema (
        <code>impact_records</code> table with <code>is_illustrative = true</code>) is fully implemented in the
        backend to support real measurement when post-action telemetry becomes available. Financial figures
        are not endorsed by Caterpillar.
      </div>
    </div>
  );
}
