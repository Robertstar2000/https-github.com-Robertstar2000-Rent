
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Truck, 
  Camera, 
  Box,
  Layers,
  Database,
  BrainCircuit
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Inventory', icon: Box, path: '/inventory' },
    { name: 'Contracts', icon: FileText, path: '/contracts' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Logistics', icon: Truck, path: '/logistics' },
  ];

  const modules = [
    { name: 'Scan360', icon: Camera, color: 'text-orange-500', path: '/scan360' },
    { name: 'AI Insights', icon: BrainCircuit, color: 'text-emerald-500', path: '/ai-insights' },
    { name: 'ERP Bridge', icon: Database, color: 'text-blue-500', path: '/admin' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen sticky top-0 flex flex-col text-slate-300 shadow-2xl z-20">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">T</div>
          TallmanRent
        </Link>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Enterprise Edition</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 pb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Specialized Modules</h3>
          <div className="space-y-1">
            {modules.map((mod) => (
              <Link
                key={mod.name}
                to={mod.path}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === mod.path ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'
                }`}
              >
                <mod.icon size={20} className={mod.color} />
                <span className="text-sm font-medium">{mod.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          to="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors w-full text-slate-400 hover:text-white"
        >
          <Settings size={20} />
          <span className="font-medium">Settings & Console</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
