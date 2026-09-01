import { useEffect, useState, useCallback } from 'react';
import { rentalsApi } from '../api/rentals';
import { assetsApi } from '../api/assets';
import type { RentalOrder, Asset } from '../types';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { ProvenancePill } from '../components/ui/ProvenancePill';

export function RentalWorkflow() {
  const [rentals, setRentals] = useState<RentalOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout form
  const [checkoutRentalId, setCheckoutRentalId] = useState('');
  const [checkoutAssetId, setCheckoutAssetId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  // Checkin form
  const [checkinRentalId, setCheckinRentalId] = useState('');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, a] = await Promise.all([rentalsApi.getAll(), assetsApi.getAll()]);
      setRentals(r);
      setAssets(a);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRental = async () => {
    try {
      const r = await rentalsApi.create();
      setCheckoutRentalId(r.id);
      setCheckoutMsg(`New rental created: ${r.id}. Now fill checkout details below.`);
      load();
    } catch (e) {
      setCheckoutMsg(`Error: ${(e as Error).message}`);
    }
  };

  const doCheckout = async () => {
    if (!checkoutRentalId || !checkoutAssetId || !checkoutDate) return;
    setCheckoutMsg(null);
    try {
      const res = await rentalsApi.checkout(checkoutRentalId, {
        asset_id: checkoutAssetId,
        checkout_date: checkoutDate,
        expected_return_date: returnDate || undefined,
      });
      setCheckoutMsg(`✓ Checkout successful. Item ID: ${res.rental_item_id}`);
      load();
    } catch (e) {
      setCheckoutMsg(`Error: ${(e as Error).message}`);
    }
  };

  const doCheckin = async () => {
    if (!checkinRentalId || !checkinDate) return;
    setCheckinMsg(null);
    try {
      await rentalsApi.checkin(checkinRentalId, { checkin_date: checkinDate });
      setCheckinMsg(`✓ Check-in complete for rental ${checkinRentalId}`);
      load();
    } catch (e) {
      setCheckinMsg(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rental Workflow</h1>
        <p className="page-subtitle">Asset check-out / check-in · Rental lifecycle management</p>
      </div>

      <div className="section-grid section-grid-2 mb-6">
        {/* Checkout */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📤 Check-Out</div>
              <div className="card-subtitle">Assign an asset to a rental order</div>
            </div>
            <ProvenancePill type="REAL" />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" id="create-rental-btn" onClick={createRental} style={{ alignSelf: 'flex-start' }}>
                + Create New Rental Order
              </button>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-rental-id">Rental ID</label>
                <input
                  id="checkout-rental-id"
                  className="form-input"
                  value={checkoutRentalId}
                  onChange={(e) => setCheckoutRentalId(e.target.value)}
                  placeholder="Paste rental UUID…"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-asset-id">Asset ID</label>
                <select
                  id="checkout-asset-id"
                  className="form-select"
                  value={checkoutAssetId}
                  onChange={(e) => setCheckoutAssetId(e.target.value)}
                >
                  <option value="">— Select asset —</option>
                  {assets.filter(a => a.status === 'AVAILABLE').map(a => (
                    <option key={a.id} value={a.id}>{a.id} [{a.status}]</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-date">Checkout Date</label>
                <input
                  id="checkout-date"
                  type="date"
                  className="form-input"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="return-date">Expected Return Date (optional)</label>
                <input
                  id="return-date"
                  type="date"
                  className="form-input"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                id="checkout-btn"
                disabled={!checkoutRentalId || !checkoutAssetId || !checkoutDate}
                onClick={doCheckout}
              >
                📤 Execute Checkout
              </button>

              {checkoutMsg && (
                <div className={`alert-bar ${checkoutMsg.startsWith('Error') ? 'alert-bar-error' : 'alert-bar-info'}`}>
                  {checkoutMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkin */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📥 Check-In</div>
              <div className="card-subtitle">Return an asset from active rental</div>
            </div>
            <ProvenancePill type="REAL" />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="checkin-rental-id">Rental ID</label>
                <select
                  id="checkin-rental-id"
                  className="form-select"
                  value={checkinRentalId}
                  onChange={(e) => setCheckinRentalId(e.target.value)}
                >
                  <option value="">— Select rental —</option>
                  {rentals.filter(r => r.status === 'NEW' || r.status === 'ACTIVE').map(r => (
                    <option key={r.id} value={r.id}>{r.id.substring(0, 16)}… [{r.status}]</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkin-date">Check-In Date</label>
                <input
                  id="checkin-date"
                  type="date"
                  className="form-input"
                  value={checkinDate}
                  onChange={(e) => setCheckinDate(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                id="checkin-btn"
                disabled={!checkinRentalId || !checkinDate}
                onClick={doCheckin}
              >
                📥 Execute Check-In
              </button>

              {checkinMsg && (
                <div className={`alert-bar ${checkinMsg.startsWith('Error') ? 'alert-bar-error' : 'alert-bar-info'}`}>
                  {checkinMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rental list */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Rental Orders</div>
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={load} />}
        {!loading && !error && (
          rentals.length === 0 ? (
            <EmptyState icon="📋" title="No rental orders" message="Create a rental order above to get started." />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rental ID</th>
                    <th>Site</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r) => (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{r.id}</td>
                      <td>{r.site_id ?? '—'}</td>
                      <td>
                        <span className={`badge ${r.status === 'ACTIVE' || r.status === 'NEW' ? 'badge-accent' : 'badge-neutral'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
