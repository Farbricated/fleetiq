import { useEffect, useState, useCallback } from 'react';
import { rentalsApi } from '../api/rentals';
import { equipmentApi } from '../api/assets';
import type { RentalOrder, EquipmentCategory, EquipmentTypeEntry, EquipmentModelEntry } from '../types';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { ProvenancePill } from '../components/ui/ProvenancePill';

// ─── Category icons ────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'Earthmoving':                  '🏗️',
  'Construction':                 '🧱',
  'Lifting & Material Handling':  '🏋️',
  'Compaction':                   '🛞',
  'Paving':                       '🛣️',
};
const TYPE_ICONS: Record<string, string> = {
  'Excavators':         '⛏️',
  'Bulldozers':         '🚜',
  'Motor Graders':      '🛤️',
  'Wheel Loaders':      '🔃',
  'Backhoe Loaders':    '🦺',
  'Skid Steer Loaders': '🔩',
  'Cranes':             '🏗️',
  'Forklifts':          '⬆️',
  'Soil Compactors':    '🔲',
  'Asphalt Compactors': '⬛',
  'Asphalt Pavers':     '🛣️',
  'Cold Planers':       '❄️',
};

// ─── Status badge ──────────────────────────────────────────────────────────────
function rentalStatusBadgeClass(status: string | null) {
  switch ((status ?? '').toUpperCase()) {
    case 'NEW':       return 'badge badge-rental-new';
    case 'ACTIVE':    return 'badge badge-rental-active';
    case 'RETURNED':  return 'badge badge-rental-returned';
    case 'CANCELLED': return 'badge badge-rental-cancelled';
    default:          return 'badge badge-neutral';
  }
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
type StepState = 'pending' | 'active' | 'completed';
function StepperStep({ number, label, state }: { number: number; label: string; state: StepState }) {
  return (
    <div className={`stepper-step ${state}`}>
      <div className="stepper-circle">{state === 'completed' ? '✓' : number}</div>
      <span className="stepper-label">{label}</span>
    </div>
  );
}

// ─── Equipment Category Picker ────────────────────────────────────────────────
interface PickerProps {
  categories: EquipmentCategory[];
  selectedAssetId: string;
  onSelect: (assetId: string, meta: { category: string; type: string; model: string }) => void;
  onClear: () => void;
}

function EquipmentPicker({ categories, selectedAssetId, onSelect, onClear }: PickerProps) {
  const [selCat, setSelCat]   = useState<EquipmentCategory | null>(null);
  const [selType, setSelType] = useState<EquipmentTypeEntry | null>(null);
  const [selModel, setSelModel] = useState<EquipmentModelEntry | null>(null);

  const reset = () => { setSelCat(null); setSelType(null); setSelModel(null); };

  // If cleared externally, reset internal nav too
  useEffect(() => { if (!selectedAssetId) reset(); }, [selectedAssetId]);

  // ── Level 0: Category grid ──
  if (!selCat) return (
    <div className="eq-picker">
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        Select a machine category:
      </div>
      <div className="eq-category-grid">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`eq-category-card${selCat === cat ? ' selected' : ''}`}
            onClick={() => setSelCat(cat)}
          >
            <span className={`eq-category-avail${cat.available_count === 0 ? ' zero' : ''}`}>
              {cat.available_count} avail
            </span>
            <div className="eq-category-icon">{CATEGORY_ICONS[cat.name] ?? '🔧'}</div>
            <div className="eq-category-name">{cat.name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Level 1: Type list ──
  if (!selType) return (
    <div className="eq-picker">
      <div className="eq-breadcrumb">
        <button className="eq-breadcrumb-back" onClick={() => setSelCat(null)}>← Categories</button>
        <span className="eq-breadcrumb-sep">/</span>
        <span className="eq-breadcrumb-item">{CATEGORY_ICONS[selCat.name] ?? '🔧'} {selCat.name}</span>
      </div>
      <div className="eq-type-list">
        {selCat.types.map(t => {
          const avail = t.models.reduce((s, m) => s + m.available_units, 0);
          return (
            <button key={t.id} className={`eq-type-btn${selType === t ? ' selected' : ''}`}
              onClick={() => setSelType(t)}>
              <span>{TYPE_ICONS[t.name] ?? '🔧'} {t.name}</span>
              <span className={`eq-type-avail-chip${avail === 0 ? ' zero' : ''}`}>{avail} avail</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Level 2: Model + unit rows ──
  return (
    <div className="eq-picker">
      <div className="eq-breadcrumb">
        <button className="eq-breadcrumb-back" onClick={() => setSelCat(null)}>← Categories</button>
        <span className="eq-breadcrumb-sep">/</span>
        <button className="eq-breadcrumb-back" onClick={() => setSelType(null)}>
          {selCat.name}
        </button>
        <span className="eq-breadcrumb-sep">/</span>
        <span className="eq-breadcrumb-item">{selType.name}</span>
      </div>
      <div className="eq-model-list">
        {selType.models.map(model => (
          <div key={model.id} className="eq-model-card">
            <div className="eq-model-header"
              onClick={() => setSelModel(selModel?.id === model.id ? null : model)}>
              <div>
                <div className="eq-model-name">{model.model_name}</div>
                <div className="eq-model-mfr">{model.manufacturer}</div>
              </div>
              <div className={`eq-model-avail${model.available_units > 0 ? ' has-avail' : ' no-avail'}`}>
                {model.available_units > 0 ? `${model.available_units} unit(s) available` : 'None available'}
                <span style={{ marginLeft: 6 }}>{selModel?.id === model.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {selModel?.id === model.id && model.assets.length > 0 && (
              <div className="eq-asset-list">
                {model.assets.map(asset => (
                  <div key={asset.id}
                    className={`eq-asset-row${selectedAssetId === asset.id ? ' selected' : ''}`}
                    onClick={() => {
                      onSelect(asset.id, {
                        category: selCat.name,
                        type: selType.name,
                        model: model.model_name,
                      });
                    }}
                  >
                    <span className="eq-asset-id">{asset.id}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-rental-active" style={{ fontSize: 10 }}>AVAILABLE</span>
                      {selectedAssetId === asset.id && <span className="eq-asset-check">✓</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selModel?.id === model.id && model.assets.length === 0 && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                No available units for this model.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function RentalWorkflow() {
  const [rentals,    setRentals]    = useState<RentalOrder[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Stepper: 1=Create, 2=Assign, 3=Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Checkout state
  const [checkoutRentalId,   setCheckoutRentalId]   = useState('');
  const [checkoutAssetId,    setCheckoutAssetId]    = useState('');
  const [checkoutAssetMeta,  setCheckoutAssetMeta]  = useState<{ category: string; type: string; model: string } | null>(null);
  const [checkoutDate,       setCheckoutDate]       = useState('');
  const [returnDate,         setReturnDate]         = useState('');
  const [checkoutMsg,        setCheckoutMsg]        = useState<string | null>(null);
  const [checkoutOk,         setCheckoutOk]         = useState(false);
  const [creatingOrder,      setCreatingOrder]      = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Checkin state
  const [checkinRentalId, setCheckinRentalId] = useState('');
  const [checkinDate,     setCheckinDate]     = useState('');
  const [checkinMsg,      setCheckinMsg]      = useState<string | null>(null);
  const [checkinOk,       setCheckinOk]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [r, cats] = await Promise.all([rentalsApi.getAll(), equipmentApi.getCategories()]);
      setRentals(r); setCategories(cats);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── actions ──────────────────────────────────────────────────────────────
  const createRental = async () => {
    setCreatingOrder(true); setCheckoutMsg(null);
    try {
      const r = await rentalsApi.create();
      setCheckoutRentalId(r.id);
      setStep(2); load();
    } catch (e) { setCheckoutMsg(`Error: ${(e as Error).message}`); }
    finally { setCreatingOrder(false); }
  };

  const doCheckout = async () => {
    if (!checkoutRentalId || !checkoutAssetId || !checkoutDate) return;
    setSubmittingCheckout(true); setCheckoutMsg(null); setCheckoutOk(false);
    try {
      const res = await rentalsApi.checkout(checkoutRentalId, {
        asset_id: checkoutAssetId,
        checkout_date: checkoutDate,
        expected_return_date: returnDate || undefined,
      });
      setCheckoutMsg(`Checkout successful — Item ID: ${res.rental_item_id}`);
      setCheckoutOk(true); load();
      setTimeout(() => {
        setStep(1); setCheckoutRentalId(''); setCheckoutAssetId('');
        setCheckoutAssetMeta(null); setCheckoutDate(''); setReturnDate('');
        setCheckoutMsg(null); setCheckoutOk(false);
      }, 3000);
    } catch (e) { setCheckoutMsg(`Error: ${(e as Error).message}`); setCheckoutOk(false); }
    finally { setSubmittingCheckout(false); }
  };

  const doCheckin = async () => {
    if (!checkinRentalId || !checkinDate) return;
    setCheckinMsg(null); setCheckinOk(false);
    try {
      await rentalsApi.checkin(checkinRentalId, { checkin_date: checkinDate });
      setCheckinMsg(`Check-in complete for ${checkinRentalId.substring(0, 16)}...`);
      setCheckinOk(true); setCheckinRentalId(''); setCheckinDate(''); load();
    } catch (e) { setCheckinMsg(`Error: ${(e as Error).message}`); setCheckinOk(false); }
  };

  // ── derived counts ─────────────────────────────────────────────────────────
  const totalRentals    = rentals.length;
  const activeRentals   = rentals.filter(r => r.status === 'ACTIVE').length;
  const newRentals      = rentals.filter(r => r.status === 'NEW').length;
  const returnedRentals = rentals.filter(r => r.status === 'RETURNED').length;
  const totalAvail      = categories.reduce((s, c) => s + c.available_count, 0);

  const stepState = (n: number): StepState =>
    n < step ? 'completed' : n === step ? 'active' : 'pending';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Rental Workflow</h1>
        <p className="page-subtitle">
          Asset check-out / check-in · End-to-end rental lifecycle management
          <ProvenancePill type="REAL" />
        </p>
      </div>

      {/* Stat bar */}
      <div className="rental-stat-bar">
        <div className="rental-stat-tile">
          <div className="rental-stat-icon blue">📋</div>
          <div className="rental-stat-body">
            <div className="rental-stat-value">{totalRentals}</div>
            <div className="rental-stat-label">Total Orders</div>
          </div>
        </div>
        <div className="rental-stat-tile">
          <div className="rental-stat-icon orange">🔑</div>
          <div className="rental-stat-body">
            <div className="rental-stat-value">{newRentals}</div>
            <div className="rental-stat-label">New</div>
          </div>
        </div>
        <div className="rental-stat-tile">
          <div className="rental-stat-icon green">✅</div>
          <div className="rental-stat-body">
            <div className="rental-stat-value">{activeRentals}</div>
            <div className="rental-stat-label">Active</div>
          </div>
        </div>
        <div className="rental-stat-tile">
          <div className="rental-stat-icon grey">🔄</div>
          <div className="rental-stat-body">
            <div className="rental-stat-value">{returnedRentals}</div>
            <div className="rental-stat-label">Returned</div>
          </div>
        </div>
        <div className="rental-stat-tile">
          <div className="rental-stat-icon blue">🚜</div>
          <div className="rental-stat-body">
            <div className="rental-stat-value">{totalAvail}</div>
            <div className="rental-stat-label">Available Assets</div>
          </div>
        </div>
      </div>

      {/* Workflow grid */}
      <div className="workflow-grid">

        {/* ── Checkout Stepper ────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📤 Check-Out Wizard</div>
              <div className="card-subtitle">Guided rental checkout — 3 steps</div>
            </div>
            <ProvenancePill type="REAL" />
          </div>

          <div className="stepper-container">
            <div className="stepper-track">
              <StepperStep number={1} label="Create Order" state={stepState(1)} />
              <StepperStep number={2} label="Select Machine" state={stepState(2)} />
              <StepperStep number={3} label="Confirm"       state={stepState(3)} />
            </div>

            {/* Step 1: Create order */}
            {step === 1 && (
              <div className="stepper-panel" key="step1">
                <div className="step-action-hero">
                  <div className="step-action-icon">📋</div>
                  <div className="step-action-title">Create a Rental Order</div>
                  <div className="step-action-subtitle">
                    Generate a new rental order. A unique ID will be assigned automatically.
                  </div>
                  <button className="btn btn-primary btn-lg" id="create-rental-btn"
                    onClick={createRental} disabled={creatingOrder}>
                    {creatingOrder ? '⏳ Creating...' : '+ Create New Rental Order'}
                  </button>
                  {checkoutMsg && (
                    <div className={`alert-bar ${checkoutMsg.startsWith('Error') ? 'alert-bar-error' : 'alert-bar-info'}`}>
                      {checkoutMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select machine from hierarchy */}
            {step === 2 && (
              <div className="stepper-panel" key="step2">
                <div className="workflow-form">
                  {/* Rental ID pill */}
                  <div>
                    <div className="form-label">📋 Rental Order ID</div>
                    <div className="rental-id-pill">
                      <span className="rental-id-pill-label">ID</span>
                      {checkoutRentalId}
                    </div>
                  </div>

                  {/* Selected asset summary / picker */}
                  {checkoutAssetId && checkoutAssetMeta ? (
                    <div>
                      <div className="form-label" style={{ marginBottom: 6 }}>✅ Selected Machine</div>
                      <div className="eq-selected-summary">
                        <div>
                          <div className="eq-selected-summary-label">
                            {checkoutAssetMeta.category} → {checkoutAssetMeta.type}
                          </div>
                          <div>{checkoutAssetMeta.model} · <span className="mono" style={{ fontSize: 11 }}>{checkoutAssetId}</span></div>
                        </div>
                        <button className="eq-clear-btn" onClick={() => { setCheckoutAssetId(''); setCheckoutAssetMeta(null); }}>
                          ✕ Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="form-label" style={{ marginBottom: 6 }}>🚜 Select Machine</div>
                      {loading ? <LoadingState /> : (
                        <EquipmentPicker
                          categories={categories}
                          selectedAssetId={checkoutAssetId}
                          onSelect={(id, meta) => { setCheckoutAssetId(id); setCheckoutAssetMeta(meta); }}
                          onClear={() => { setCheckoutAssetId(''); setCheckoutAssetMeta(null); }}
                        />
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-date">📅 Checkout Date</label>
                      <input id="checkout-date" type="date" className="form-input"
                        value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="return-date">
                        📅 Expected Return <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                      </label>
                      <input id="return-date" type="date" className="form-input"
                        value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="step-nav">
                    <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn btn-primary"
                      disabled={!checkoutAssetId || !checkoutDate}
                      onClick={() => setStep(3)}>
                      Review &amp; Confirm →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="stepper-panel" key="step3">
                <div className="workflow-form">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Review checkout details before submitting:
                  </div>
                  <div className="confirm-summary">
                    <div className="confirm-row">
                      <span className="confirm-row-label">Rental Order ID</span>
                      <span className="confirm-row-value mono" style={{ fontSize: 11 }}>{checkoutRentalId.substring(0, 24)}...</span>
                    </div>
                    {checkoutAssetMeta && (
                      <>
                        <div className="confirm-row">
                          <span className="confirm-row-label">Category</span>
                          <span className="confirm-row-value">{checkoutAssetMeta.category}</span>
                        </div>
                        <div className="confirm-row">
                          <span className="confirm-row-label">Machine Type</span>
                          <span className="confirm-row-value">{checkoutAssetMeta.type}</span>
                        </div>
                        <div className="confirm-row">
                          <span className="confirm-row-label">Model</span>
                          <span className="confirm-row-value">{checkoutAssetMeta.model}</span>
                        </div>
                      </>
                    )}
                    <div className="confirm-row">
                      <span className="confirm-row-label">Unit ID</span>
                      <span className="confirm-row-value mono" style={{ fontSize: 11 }}>{checkoutAssetId}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-row-label">Checkout Date</span>
                      <span className="confirm-row-value">{checkoutDate}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-row-label">Expected Return</span>
                      <span className="confirm-row-value">{returnDate || '—'}</span>
                    </div>
                  </div>
                  {checkoutMsg && (
                    <div className={`alert-bar ${checkoutOk ? 'alert-bar-success' : 'alert-bar-error'}`}>
                      {checkoutOk ? '✓ ' : '✕ '}{checkoutMsg}
                    </div>
                  )}
                  <div className="step-nav">
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setStep(2)} disabled={submittingCheckout}>← Edit</button>
                    <button className="btn btn-primary" id="checkout-btn"
                      disabled={submittingCheckout || checkoutOk} onClick={doCheckout}>
                      {submittingCheckout ? '⏳ Processing...' : '📤 Execute Checkout'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Check-In Card ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📥 Check-In</div>
              <div className="card-subtitle">Return an asset from active rental</div>
            </div>
            <ProvenancePill type="REAL" />
          </div>
          <div className="card-body">
            <div className="workflow-form">
              <div className="form-group">
                <label className="form-label" htmlFor="checkin-rental-id">🔑 Active Rental</label>
                <select id="checkin-rental-id" className="form-select"
                  value={checkinRentalId} onChange={e => setCheckinRentalId(e.target.value)}>
                  <option value="">— Select rental to return —</option>
                  {rentals.filter(r => r.status === 'ACTIVE').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.id.substring(0, 16)}... · {r.site_id ?? 'No Site'} · [{r.status}]
                    </option>
                  ))}
                </select>
                <span className="form-helper">
                  {rentals.filter(r => r.status === 'ACTIVE').length} rental(s) eligible
                </span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="checkin-date">📅 Check-In Date</label>
                <input id="checkin-date" type="date" className="form-input"
                  value={checkinDate} onChange={e => setCheckinDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" id="checkin-btn"
                disabled={!checkinRentalId || !checkinDate} onClick={doCheckin}>
                📥 Execute Check-In
              </button>
              {checkinMsg && (
                <div className={`alert-bar ${checkinOk ? 'alert-bar-success' : 'alert-bar-error'}`}>
                  {checkinOk ? '✓ ' : '✕ '}{checkinMsg}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* All Rental Orders */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Rental Orders</div>
        </div>
        {!loading && !error && rentals.length > 0 && (
          <div className="table-summary-bar">
            <div className="table-summary-item"><strong>{totalRentals}</strong> total</div>
            <div className="table-summary-divider" />
            <div className="table-summary-item">
              <span className="badge badge-rental-new">NEW</span>
              <strong>{newRentals}</strong>
            </div>
            <div className="table-summary-divider" />
            <div className="table-summary-item">
              <span className="badge badge-rental-active">ACTIVE</span>
              <strong>{activeRentals}</strong>
            </div>
            <div className="table-summary-divider" />
            <div className="table-summary-item">
              <span className="badge badge-rental-returned">RETURNED</span>
              <strong>{returnedRentals}</strong>
            </div>
          </div>
        )}
        {loading && <LoadingState />}
        {error   && <ErrorState error={error} onRetry={load} />}
        {!loading && !error && (
          rentals.length === 0 ? (
            <EmptyState icon="📋" title="No rental orders" message="Create a rental order above to get started." />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rental ID</th>
                    <th>Customer</th>
                    <th>Site</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map(r => (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{r.id}</td>
                      <td className="text-muted">{r.customer_id ?? '—'}</td>
                      <td>{r.site_id ?? '—'}</td>
                      <td>
                        <span className={rentalStatusBadgeClass(r.status)}>{r.status ?? '—'}</span>
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