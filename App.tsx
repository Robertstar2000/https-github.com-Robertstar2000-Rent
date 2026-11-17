
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Contracts from './pages/Contracts';
import Customers from './pages/Customers';
import Logistics from './pages/Logistics';
import Reports from './pages/Reports';
import Scan360 from './pages/Scan360';
import AdminConsole from './pages/AdminConsole';
import AIInsights from './pages/AIInsights';
import { DataProvider } from './contexts/DataContext';

const App: React.FC = () => {
  return (
    <DataProvider>
      <Router>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/logistics" element={<Logistics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/scan360" element={<Scan360 />} />
                  <Route path="/admin" element={<AdminConsole />} />
                  <Route path="/ai-insights" element={<AIInsights />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </DataProvider>
  );
};

export default App;
