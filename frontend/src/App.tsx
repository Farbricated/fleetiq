import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { FleetCommandCenter } from './pages/FleetCommandCenter';
import { AssetDashboard } from './pages/AssetDashboard';
import { Asset360 } from './pages/Asset360';
import { AlertsPage } from './pages/AlertsPage';
import { UtilizationAnalytics } from './pages/UtilizationAnalytics';
import { RiskDashboard } from './pages/RiskDashboard';
import { DemandForecasting } from './pages/DemandForecasting';
import { AllocationCandidates } from './pages/AllocationCandidates';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ApprovalFlow } from './pages/ApprovalFlow';
import { ActionStatus } from './pages/ActionStatus';
import { ImpactPage } from './pages/ImpactPage';
import { RentalWorkflow } from './pages/RentalWorkflow';
import { CopilotWidget } from './components/chat/CopilotWidget';

function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => setApiOnline(r.ok))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar apiOnline={apiOnline} />
        <div className="app-main">
          <TopBar />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<FleetCommandCenter />} />
              <Route path="/assets" element={<AssetDashboard />} />
              <Route path="/assets/:assetId" element={<Asset360 />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/utilization" element={<UtilizationAnalytics />} />
              <Route path="/risk" element={<RiskDashboard />} />
              <Route path="/forecasting" element={<DemandForecasting />} />
              <Route path="/candidates" element={<AllocationCandidates />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/approvals" element={<ApprovalFlow />} />
              <Route path="/actions" element={<ActionStatus />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/impact/:recommendationId" element={<ImpactPage />} />
              <Route path="/rentals" element={<RentalWorkflow />} />
              <Route path="*" element={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</div>
                  <h2>Page not found</h2>
                  <p>The requested page doesn't exist or you don't have access.</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
        <CopilotWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;
