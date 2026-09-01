import { useNavigate } from 'react-router-dom';
import { ProvenancePill } from '../components/ui/ProvenancePill';

const MOCK_ACTIONS = [
  {
    id: 'act-001',
    recommendation: 'REASSIGN EQX1007',
    asset: 'EQX1007',
    action: 'APPROVED',
    actor: 'Fleet Manager',
    timestamp: '2025-04-16T10:23:00Z',
    status: 'PENDING_EXECUTION',
  },
];

export function ActionStatus() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Action Status</h1>
        <p className="page-subtitle">Pending and completed actions from approved recommendations · Phase 9 pending</p>
      </div>

      <div className="alert-bar alert-bar-warning mb-6">
        ⚠ Phase 9 backend not yet implemented. The action below is a <strong>SIMULATED</strong> demo record. When Phase 9 lands, this will read from <code>recommendation_actions</code> in the database.
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Action Log</div>
          <ProvenancePill type="SIMULATED" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action ID</th>
                <th>Recommendation</th>
                <th>Asset</th>
                <th>Decision</th>
                <th>Actor</th>
                <th>Timestamp</th>
                <th>Execution Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIONS.map((a) => (
                <tr key={a.id}>
                  <td className="mono" style={{ fontSize: 11 }}>{a.id}</td>
                  <td>{a.recommendation}</td>
                  <td className="asset-id-cell">{a.asset}</td>
                  <td>
                    <span className="badge badge-low">APPROVED</span>
                  </td>
                  <td>{a.actor}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{new Date(a.timestamp).toLocaleDateString()}</td>
                  <td>
                    <span className="badge badge-medium">PENDING EXECUTION</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('/impact')}
                    >
                      View Impact →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
