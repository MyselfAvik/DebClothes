import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Package, ShoppingCart, Users, TrendingUp, ShieldAlert, Sparkles, LayoutDashboard } from 'lucide-react';
import API from '../../api/axios';

const Dashboard = () => {
  const [pendingActionCount, setPendingActionCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/api/orders');
        if (Array.isArray(data)) {
          const count = data.filter(
            (o) => o.orderStatus === 'placed' || o.orderStatus === 'return_requested'
          ).length;
          setPendingActionCount(count);
        }
      } catch (err) {
        // quiet error fallback
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-[90vh] flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-full shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#0d1322]/80 backdrop-blur-xl md:w-64 md:border-b-0 md:border-r md:border-slate-200 dark:md:border-slate-850 shadow-sm">
        <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-wider">
            <LayoutDashboard className="h-5 w-5" />
            <span>Control Panel</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Admin Operations Center</p>
        </div>

        <nav className="space-y-1.5 p-4">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Package className="h-4.5 w-4.5" />
              <span>Products Catalog</span>
            </div>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-4.5 w-4.5" />
              <span>Customer Orders</span>
            </div>
            {pendingActionCount > 0 && (
              <span className="rounded-full bg-amber-500 text-slate-950 font-black px-2 py-0.5 text-[10px] animate-pulse">
                {pendingActionCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/sales"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Sales & Analytics</span>
            </div>
          </NavLink>

          <NavLink
            to="/admin/customers"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Users className="h-4.5 w-4.5" />
              <span>Customers</span>
            </div>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
