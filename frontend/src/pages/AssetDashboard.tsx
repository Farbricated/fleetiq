import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsApi } from '../api/assets';
import type { Asset } from '../types';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { AssetStatusBadge } from '../components/ui/Badge';

type FilterStatus = 'ALL' | 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

export function AssetDashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.getAll();
      setAssets(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = assets.filter((a) => {
    const matchStatus = filter === 'ALL' || a.status?.toUpperCase() === filter;
    const matchSearch = a.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Asset Dashboard</h1>
        <p className="page-subtitle">All {assets.length} fleet assets · Click any row to open Asset 360</p>
      </div>

      <div className="toolbar">
        <input
          className="form-input"
          id="asset-search"
          type="text"
          placeholder="Search asset ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
        {(['ALL', 'AVAILABLE', 'RENTED', 'MAINTENANCE'] as FilterStatus[]).map((f) => (
          <button
            key={f}
            id={`filter-${f.toLowerCase()}`}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {loading && <LoadingState message="Loading assets…" />}
      {error && <ErrorState error={error} onRetry={load} />}

      {!loading && !error && (
        filtered.length === 0 ? (
          <EmptyState
            icon="🏗"
            title="No assets found"
            message={search ? `No assets match "${search}"` : 'No assets in the selected status.'}
          />
        ) : (
          <div className="card">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Dealer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="clickable"
                      onClick={() => navigate(`/assets/${a.id}`)}
                      data-testid={`asset-row-${a.id}`}
                      style={a.id === 'EQX1007' ? {
                        background: 'rgba(239,68,68,0.1)',
                        borderLeft: '3px solid var(--color-critical)',
                        position: 'relative',
                      } : undefined}
                    >
                      <td>
                        <span className="asset-id-cell" style={a.id === 'EQX1007' ? { fontWeight: 700, color: 'var(--color-critical)' } : undefined}>{a.id}</span>
                        {a.id === 'EQX1007' && (
                          <>
                            <span className="badge badge-critical" style={{ marginLeft: 8 }}>⚠ IDLE</span>
                            <span className="badge" style={{ marginLeft: 4, background: 'rgba(239,68,68,0.15)', color: 'var(--color-critical)', fontSize: 9 }}>0 ENGINE HRS</span>
                          </>
                        )}
                      </td>
                      <td><AssetStatusBadge status={a.status} /></td>
                      <td className="text-muted mono" style={{ fontSize: 11 }}>
                        {a.model_id ? a.model_id.substring(0, 8) + '…' : '—'}
                      </td>
                      <td className="text-muted mono" style={{ fontSize: 11 }}>
                        {a.dealer_id ? a.dealer_id.substring(0, 8) + '…' : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${a.id}`);
                          }}
                          style={a.id === 'EQX1007' ? { borderColor: 'var(--color-critical)', color: 'var(--color-critical)' } : undefined}
                        >
                          Asset 360 →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
