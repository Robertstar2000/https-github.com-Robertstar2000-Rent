import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewOrder from './pages/NewOrder';
import FlowChart from './pages/FlowChart';
import ReturnsAndRepairs from './pages/ReturnsAndRepairs';
import Inventory from './pages/Inventory';
import Contracts from './pages/Contracts';
import Customers from './pages/Customers';
import OnboardCustomer from './pages/OnboardCustomer';
import Reports from './pages/Reports';
import Scan360 from './pages/Scan360';
import AdminConsole from './pages/AdminConsole';
import AIInsights from './pages/AIInsights';
import { DataProvider, useData } from './contexts/DataContext';
import CustomerOnboardingModal from './components/CustomerOnboardingModal';

const GlobalReVettingHost: React.FC = () => {
  const { revetTargetCustomer, closeReVettingModal } = useData();
  return (
    <CustomerOnboardingModal
      isOpen={Boolean(revetTargetCustomer)}
      onClose={closeReVettingModal}
      prefillCustomer={revetTargetCustomer}
    />
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <Router>
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-[1600px] mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/new-order" element={<NewOrder />} />
                  <Route path="/flowchart" element={<FlowChart />} />
                  <Route path="/returns" element={<ReturnsAndRepairs />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/onboard-customer" element={<OnboardCustomer />} />
                  <Route path="/logistics" element={<Navigate to="/returns" replace />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/scan360" element={<Scan360 />} />
                  <Route path="/admin" element={<AdminConsole />} />
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
          <GlobalReVettingHost />
        </div>
      </Router>
    </DataProvider>
  );
};

export default App;
