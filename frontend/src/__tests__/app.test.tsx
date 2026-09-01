import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mockFetchResponse } from './setup';

// ─── Component imports ───
import { FleetCommandCenter } from '../pages/FleetCommandCenter';
import { AssetDashboard } from '../pages/AssetDashboard';
import { Asset360 } from '../pages/Asset360';
import { AlertsPage } from '../pages/AlertsPage';
import { UtilizationAnalytics } from '../pages/UtilizationAnalytics';
import { RiskDashboard } from '../pages/RiskDashboard';
import { DemandForecasting } from '../pages/DemandForecasting';
import { AllocationCandidates } from '../pages/AllocationCandidates';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { ApprovalFlow } from '../pages/ApprovalFlow';
import { ActionStatus } from '../pages/ActionStatus';
import { ImpactPage } from '../pages/ImpactPage';
import { ProvenancePill } from '../components/ui/ProvenancePill';
import { SeverityBadge, AssetStatusBadge } from '../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import { UtilizationBar } from '../components/analytics/UtilizationBar';

// ─── Mock data ───
const MOCK_SUMMARY = {
  total_assets: 7,
  available_assets: 1,
  rented_assets: 6,
  overdue_assets: 0,
  idle_assets: 2,
  active_rentals: 6,
  active_alerts: 1,
};

const MOCK_FLEET = {
  total_assets: 7,
  average_utilization: 43.5,
  idle_assets: 1,
  underutilized_assets: 1,
  high_risk_assets: 1,
  anomaly_count: 0,
  overdue_assets: 0,
};

const MOCK_ASSETS = [
  { id: 'EQX1001', status: 'RENTED', model_id: null, dealer_id: null },
  { id: 'EQX1007', status: 'RENTED', model_id: null, dealer_id: null },
];

const MOCK_ANALYTICS = {
  asset_id: 'EQX1007',
  utilization_percent: 0.0,
  idle_percent: 100.0,
  productive_hours_derived: 0.0,
  underutilization_score: '70',
  underutilization_severity: 'HIGH',
  reasons: [
    '12.0 idle hours recorded with 0 engine hours (+50)',
    'No operator assigned (+20)',
  ],
  model_version: '1.0.0',
  method: 'rule_based',
  timestamp: '2025-04-16T00:00:00Z',
};

const MOCK_RISK = {
  asset_id: 'EQX1007',
  risk_score: '60',
  risk_level: 'CRITICAL',
  risk_factors: [
    'Unusual usage: high idle time with zero engine hours (+40)',
    'Unusually high idle time (12.0h) (+20)',
  ],
  explanation: 'CRITICAL: Unusual usage: high idle time with zero engine hours',
  model_version: '1.0.0',
  method: 'rule_based',
  timestamp: '2025-04-16T00:00:00Z',
};

const MOCK_USAGE = [
  {
    id: 'u-001',
    asset_id: 'EQX1007',
    date: '2025-04-01',
    engine_hours: 0,
    idle_hours: 12,
    operating_days: 1,
    derived_utilization_percent: 0.0,
  },
];

const MOCK_EVENTS: unknown[] = [];
const MOCK_OPERATORS = [{ id: 'OP101', name: 'Operator 1', status: 'AVAILABLE' }];

function wrap(component: React.ReactElement, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {component}
    </MemoryRouter>
  );
}

// ─── Tests ───

describe('ProvenancePill', () => {
  it('renders REAL label', () => {
    render(<ProvenancePill type="REAL" />);
    expect(screen.getByText('Real / Official')).toBeTruthy();
  });
  it('renders DERIVED label', () => {
    render(<ProvenancePill type="DERIVED" />);
    expect(screen.getByText('Derived')).toBeTruthy();
  });
  it('renders SIMULATED label', () => {
    render(<ProvenancePill type="SIMULATED" />);
    expect(screen.getByText('Simulated')).toBeTruthy();
  });
  it('renders ILLUSTRATIVE ESTIMATE label', () => {
    render(<ProvenancePill type="ILLUSTRATIVE ESTIMATE" />);
    expect(screen.getByText('Illustrative Est.')).toBeTruthy();
  });
});

describe('Badge', () => {
  it('renders SeverityBadge CRITICAL', () => {
    render(<SeverityBadge level="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeTruthy();
  });
  it('renders AssetStatusBadge AVAILABLE', () => {
    render(<AssetStatusBadge status="AVAILABLE" />);
    expect(screen.getByText('AVAILABLE')).toBeTruthy();
  });
  it('renders AssetStatusBadge null gracefully', () => {
    render(<AssetStatusBadge status={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});

describe('LoadingState', () => {
  it('renders loading indicator', () => {
    render(<LoadingState message="Loading data…" />);
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(screen.getByText('Loading data…')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders empty message', () => {
    render(<EmptyState title="No results" message="Nothing here." />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Nothing here.')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('renders error with retry button', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error="API failed" onRetry={onRetry} />);
    expect(screen.getByTestId('error-state')).toBeTruthy();
    expect(screen.getByText('API failed')).toBeTruthy();
    const retryBtn = screen.getByText('Retry');
    await userEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('UtilizationBar', () => {
  it('renders 0% as low (red fill class)', () => {
    const { container } = render(<UtilizationBar percent={0} />);
    const fill = container.querySelector('.util-bar-low');
    expect(fill).toBeTruthy();
  });
  it('renders 80% as good (green fill class)', () => {
    const { container } = render(<UtilizationBar percent={80} />);
    const fill = container.querySelector('.util-bar-good');
    expect(fill).toBeTruthy();
  });
  it('shows label by default', () => {
    render(<UtilizationBar percent={42} />);
    expect(screen.getByText('42.0%')).toBeTruthy();
  });
});

describe('FleetCommandCenter', () => {
  it('shows loading state initially', () => {
    // Mock slow fetch
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Promise(() => {})
    );
    wrap(<FleetCommandCenter />);
    expect(screen.getByTestId('loading-state')).toBeTruthy();
  });

  it('renders KPI tiles on success', async () => {
    mockFetchResponse(MOCK_SUMMARY); // dashboard/summary
    mockFetchResponse(MOCK_FLEET);   // analytics/fleet
    mockFetchResponse(MOCK_ASSETS);  // assets

    wrap(<FleetCommandCenter />);
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeTruthy();
    });
    expect(screen.getByText('Active Rentals')).toBeTruthy();
  });

  it('shows EQX1007 spotlight', async () => {
    mockFetchResponse(MOCK_SUMMARY);
    mockFetchResponse(MOCK_FLEET);
    mockFetchResponse(MOCK_ASSETS);

    wrap(<FleetCommandCenter />);
    await waitFor(() => {
      const eqx = screen.getAllByText('EQX1007');
      expect(eqx.length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/HIGH underutilization/).length).toBeGreaterThan(0);
  });

  it('shows error state on API failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    wrap(<FleetCommandCenter />);
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeTruthy();
    });
  });
});

describe('AssetDashboard', () => {
  it('renders asset table with filters', async () => {
    mockFetchResponse(MOCK_ASSETS);

    wrap(<AssetDashboard />);
    await waitFor(() => {
      expect(screen.getByText('EQX1001')).toBeTruthy();
    });
    // Filter buttons should be present
    expect(screen.getAllByText('AVAILABLE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RENTED').length).toBeGreaterThan(0);
  });

  it('shows DEMO badge for EQX1007', async () => {
    mockFetchResponse(MOCK_ASSETS);
    wrap(<AssetDashboard />);
    await waitFor(() => {
      const demos = screen.getAllByText('DEMO');
      expect(demos.length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no assets match filter', async () => {
    mockFetchResponse([]);
    wrap(<AssetDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeTruthy();
    });
  });
});

describe('Asset360', () => {
  beforeEach(() => {
    // All tabs need data
    mockFetchResponse(MOCK_ASSETS[1]); // asset
    mockFetchResponse(MOCK_USAGE);     // usage
    mockFetchResponse(MOCK_EVENTS);    // events
    mockFetchResponse(MOCK_ANALYTICS); // analytics
    mockFetchResponse(MOCK_RISK);      // risk
    mockFetchResponse(MOCK_OPERATORS); // operators
  });

  it('renders EQX1007 with DEMO ASSET badge', async () => {
    wrap(
      <Routes>
        <Route path="/assets/:assetId" element={<Asset360 />} />
      </Routes>,
      '/assets/EQX1007'
    );
    await waitFor(() => {
      const eqx = screen.getAllByText('EQX1007');
      expect(eqx.length).toBeGreaterThan(0);
    });
    const demoAsset = screen.getAllByText('DEMO ASSET');
    expect(demoAsset.length).toBeGreaterThan(0);
  });

  it('shows attention banner for EQX1007', async () => {
    wrap(
      <Routes>
        <Route path="/assets/:assetId" element={<Asset360 />} />
      </Routes>,
      '/assets/EQX1007'
    );
    await waitFor(() => {
      const banners = screen.getAllByText(/Primary Demo Signature/);
      expect(banners.length).toBeGreaterThan(0);
    });
  });

  it('renders tabs', async () => {
    wrap(
      <Routes>
        <Route path="/assets/:assetId" element={<Asset360 />} />
      </Routes>,
      '/assets/EQX1007'
    );
    await waitFor(() => {
      expect(screen.getAllByText(/Overview/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Utilization/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Risk/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Events/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Operations/).length).toBeGreaterThan(0);
  });
});

describe('AlertsPage', () => {
  it('shows alerts table', async () => {
    mockFetchResponse([{
      id: 'a-001',
      asset_id: 'EQX1007',
      type: 'UNDERUTILIZATION',
      severity: 'HIGH',
      status: 'ACTIVE',
      reason: 'Test reason',
      created_at: '2025-04-01T00:00:00Z',
    }]);
    wrap(<AlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('UNDERUTILIZATION')).toBeTruthy();
    });
  });

  it('shows empty state when no alerts', async () => {
    mockFetchResponse([]);
    wrap(<AlertsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeTruthy();
    });
  });
});

describe('DemandForecasting', () => {
  it('renders DERIVED badge instead of SIMULATED', async () => {
    mockFetchResponse([]);
    wrap(<DemandForecasting />);
    const title = await screen.findByText('Demand Forecasting');
    expect(title).toBeTruthy();
    const pills = screen.getAllByText('Derived');
    expect(pills.length).toBeGreaterThan(0);
  });
});

describe('AllocationCandidates', () => {
  it('renders error when no forecast id provided', async () => {
    mockFetchResponse([]);
    wrap(<AllocationCandidates />);
    const error = await screen.findByText(/No forecast ID provided in URL/);
    expect(error).toBeTruthy();
  });
});

describe('ApprovalFlow', () => {
  it('renders error when no recommendation id provided', async () => {
    mockFetchResponse(null);
    wrap(<ApprovalFlow />);
    const error = await screen.findByText('No recommendation ID provided');
    expect(error).toBeTruthy();
  });
});

describe('ImpactPage', () => {
  it('renders empty state when no action selected', () => {
    wrap(<ImpactPage />);
    expect(screen.getByText('No Action Selected')).toBeTruthy();
  });
});

describe('ActionStatus', () => {
  it('renders Action Status page', async () => {
    mockFetchResponse([]);
    wrap(<ActionStatus />);
    const title = await screen.findByText('Action Status');
    expect(title).toBeTruthy();
  });
});

describe('Navigation', () => {
  it('navigates to recommendations from approval', () => {
    // Just check page renders without crashing
    wrap(<RecommendationsPage />);
    // API calls will fail (unmocked) but page structure should render
  });
});
