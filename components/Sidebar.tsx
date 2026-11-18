import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FilePlus2,
  LayoutDashboard,
  GitBranch,
  ClipboardCheck,
  Box,
  FileText,
  Users,
  UserPlus,
  BarChart3,
  Camera,
  BrainCircuit,
  Database,
  Settings
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { contracts, workOrders, replacementOrders } = useData();

  const openRepairsCount = workOrders.filter(w => w.status !== 'Completed').length;

  const operationsItems = [
    {
      name: 'Returns, Repair & Replacements',
      icon: ClipboardCheck,
      path: '/returns',
      count: `${openRepairsCount + replacementOrders.length}`
    },
    { name: 'Tool & Equipment Inventory', icon: Box, path: '/inventory' },
    { name: 'Contracts & Return Dates', icon: FileText, path: '/contracts' },
    { name: 'Customers & Monthly Billing', icon: Users, path: '/customers' },
    { name: 'Onboard Rental Customer', icon: UserPlus, path: '/onboard-customer' }
  ];

  const rentalViewItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    {
      name: 'Customer Flow Chart',
      icon: GitBranch,
      path: '/flowchart',
      count: `${contracts.length}`
    },
    { name: 'Analytics & Reports', icon: BarChart3, path: '/reports' }
  ];

  const modules = [
    { name: 'Scan360 Tool Audit', icon: Camera, accent: 'text-amber-400', path: '/scan360' },
    { name: 'Tool Intelligence', icon: BrainCircuit, accent: 'text-emerald-400', path: '/ai-insights' },
    { name: 'Epicor P21 Bridge', icon: Database, accent: 'text-blue-400', path: '/admin' }
  ];

  const renderNavLink = (item: {
    name: string;
    icon: React.ElementType;
    path: string;
    count?: string;
  }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.name}
        to={item.path}
        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <item.icon
            size={15}
            className={`shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="truncate">{item.name}</span>
        </div>
        {item.count && (
          <span
            className={`font-mono text-[11px] tabular-nums shrink-0 ${
              isActive ? 'text-blue-100 font-semibold' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          >
            {item.count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-950 h-screen sticky top-0 flex flex-col text-slate-300 border-r border-slate-800/80 shrink-0 z-20 select-none">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-slate-800/80">
        <Link
          to="/"
          className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2.5 whitespace-nowrap"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
            TR
          </div>
          <span>TallmanRent</span>
        </Link>
        <p className="text-[11px] text-slate-400 mt-1 font-medium pl-9">
          Tools & Equipment Rental
        </p>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {/* First Button: New Order / Contract */}
        <div>
          <Link
            to="/new-order"
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
              location.pathname === '/new-order'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FilePlus2 size={16} className="shrink-0" />
              <span className="truncate">+ New Order / Contract</span>
            </div>
          </Link>
        </div>

        {/* Operations Group */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5 px-3">
            Operations
          </p>
          <div className="space-y-0.5">{operationsItems.map(renderNavLink)}</div>
        </div>

        {/* Rental View Group (below Operations) */}
        <div className="pt-2 border-t border-slate-800/70">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5 px-3">
            Rental View
          </p>
          <div className="space-y-0.5">{rentalViewItems.map(renderNavLink)}</div>
        </div>

        {/* Inspection & ERP Modules Group */}
        <div className="pt-2 border-t border-slate-800/70">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5 px-3">
            Inspection & ERP Modules
          </p>
          <div className="space-y-0.5">
            {modules.map(mod => {
              const isActive = location.pathname === mod.path;
              return (
                <Link
                  key={mod.name}
                  to={mod.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <mod.icon
                    size={15}
                    className={`shrink-0 ${isActive ? 'text-white' : mod.accent}`}
                  />
                  <span className="truncate">{mod.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Settings Link */}
      <div className="p-2.5 border-t border-slate-800/80">
        <Link
          to="/admin"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors w-full text-[12px] font-medium whitespace-nowrap ${
            location.pathname === '/admin'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Settings size={15} />
          <span>Settings & ERP Console</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
