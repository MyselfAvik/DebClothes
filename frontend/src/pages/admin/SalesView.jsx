import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { IndianRupee, ShoppingBag, Package, TrendingUp, AlertCircle, CheckCircle, RefreshCw, CreditCard } from 'lucide-react';

const SalesView = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes] = await Promise.all([
        API.get('/api/orders'),
        API.get('/api/products', { params: { limit: 100 } }),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales database');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-405">
        {error}
      </div>
    );
  }

  // Analytics Computations
  const completedOrders = (orders || []).filter(
    (o) => o.paymentStatus === 'paid' || o.orderStatus === 'delivered'
  );

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrdersCount = (orders || []).length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  
  const activeProductsCount = (products || []).filter((p) => p.isActive).length;
  const totalProductsCount = (products || []).length;

  // Payments Breakdown
  const codOrders = completedOrders.filter((o) => o.paymentMethod === 'COD');
  const onlineOrders = completedOrders.filter((o) => o.paymentMethod === 'RAZORPAY');

  const codRevenue = codOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const onlineRevenue = onlineOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Low Stock Alerts (Stock <= 3 for any size)
  const lowStockProducts = (products || []).filter((p) =>
    p.sizes?.some((s) => s.stock <= 3)
  );

  // Recent 5 Orders
  const recentOrders = (orders || []).slice(0, 5);

  // Group last 7 days sales data for SVG line chart
  const getRevenueTrendData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dateKey: d.toDateString(),
        revenue: 0
      });
    }

    completedOrders.forEach(o => {
      const orderDate = new Date(o.createdAt).toDateString();
      const match = days.find(day => day.dateKey === orderDate);
      if (match) {
        match.revenue += (o.totalAmount || 0);
      }
    });

    return days;
  };

  // Calculate Best Selling / Purchased Products from all non-cancelled orders
  const getBestSellers = () => {
    const salesMap = {};
    const validOrders = (orders || []).filter((o) => o.orderStatus !== 'cancelled');

    validOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const prodId = item.product?._id || item.product;
        if (!prodId) return;

        if (!salesMap[prodId]) {
          salesMap[prodId] = {
            _id: prodId,
            title: item.product?.title || 'Unknown Product',
            image: item.product?.images?.[0] || '',
            unitsSold: 0,
            orderCount: 0,
            revenueGenerated: 0
          };
        }
        salesMap[prodId].unitsSold += item.qty || 1;
        salesMap[prodId].orderCount += 1;
        salesMap[prodId].revenueGenerated += (item.priceAtPurchase || 0) * (item.qty || 1);
      });
    });

    const sortedList = Object.values(salesMap).sort((a, b) => b.unitsSold - a.unitsSold);
    return showAllPurchases ? sortedList : sortedList.slice(0, 5);
  };

  const trendData = getRevenueTrendData();
  const maxRevenue = Math.max(...trendData.map(d => d.revenue), 1000);
  const bestSellers = getBestSellers();
  
  // SVG drawing configuration specs
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = trendData.map((d, i) => {
    const x = paddingLeft + (i / (trendData.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (d.revenue / maxRevenue) * plotHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales & Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time revenue metrics, inventory warnings, and transaction logs</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Total Revenue</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">₹{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Total Orders</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{totalOrdersCount}</h3>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Avg Order Value</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">₹{avgOrderValue.toLocaleString()}</h3>
          </div>
          <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Product Catalog */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Active Catalog</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{activeProductsCount} / {totalProductsCount}</h3>
          </div>
          <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Trend Line Chart */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>Revenue Trend (Last 7 Days)</span>
            </h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
              Max: ₹{maxRevenue.toLocaleString()}
            </span>
          </div>
          
          <div className="relative">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00"/>
                </linearGradient>
              </defs>
              
              {/* Y Axis Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yVal = paddingTop + plotHeight - ratio * plotHeight;
                const revLabel = Math.round(ratio * maxRevenue);
                return (
                  <g key={idx} className="opacity-40 dark:opacity-20">
                    <line
                      x1={paddingLeft}
                      y1={yVal}
                      x2={svgWidth - paddingRight}
                      y2={yVal}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-slate-400 dark:text-slate-600"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yVal + 4}
                      textAnchor="end"
                      className="text-[9px] fill-slate-500 dark:fill-slate-400 font-bold"
                    >
                      ₹{revLabel >= 1000 ? (revLabel / 1000).toFixed(1) + 'k' : revLabel}
                    </text>
                  </g>
                );
              })}
              
              {/* Area path */}
              {areaPath && (
                <path d={areaPath} fill="url(#areaGradient)" />
              )}
              
              {/* Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Interactive Dots and Labels */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  {/* Outer circle halo on hover */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    className="fill-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                  {/* Point node dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-[#0b0f19] stroke-2"
                  />
                  {/* Tooltip value popup */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <rect
                      x={p.x - 35}
                      y={p.y - 32}
                      width="70"
                      height="20"
                      rx="6"
                      className="fill-slate-900 dark:fill-white text-white dark:text-slate-900 shadow"
                    />
                    <text
                      x={p.x}
                      y={p.y - 18}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-white dark:fill-slate-900"
                    >
                      ₹{p.revenue}
                    </text>
                  </g>
                  {/* X Axis Labels */}
                  <text
                    x={p.x}
                    y={svgHeight - paddingBottom + 18}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-slate-500 dark:fill-slate-400"
                  >
                    {p.dateStr}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Channels Donut Chart */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <h3 className="text-md font-bold text-slate-905 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span>Revenue Channels Distribution</span>
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* Donut SVG */}
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
                {/* Gray back ring */}
                <circle
                  cx="70"
                  cy="70"
                  r="45"
                  fill="transparent"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="12"
                />
                {/* COD segment */}
                <circle
                  cx="70"
                  cy="70"
                  r="45"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray="282.7"
                  strokeDashoffset="0"
                />
                {/* Razorpay segment (drawn on top) */}
                <circle
                  cx="70"
                  cy="70"
                  r="45"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${(completedOrders.length > 0 ? (onlineRevenue / totalRevenue) * 282.7 : 0).toFixed(1)} 282.7`}
                  strokeDashoffset="0"
                />
              </svg>
              {/* Donut center absolute label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Online</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {completedOrders.length > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}%
                </span>
              </div>
            </div>
            
            {/* Legend Labels */}
            <div className="space-y-4 w-full max-w-[240px] text-xs">
              <div className="flex items-center justify-between border-l-4 border-blue-500 pl-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Online Cards</span>
                  <span className="block text-[10px] text-slate-455">Razorpay Gateway</span>
                </div>
                <span className="font-bold text-slate-850 dark:text-slate-200">₹{onlineRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Cash on Delivery</span>
                  <span className="block text-[10px] text-slate-455">COD Payment</span>
                </div>
                <span className="font-bold text-slate-850 dark:text-slate-200">₹{codRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Chart Box */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 space-y-6 shadow-sm">
          <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span>Revenue Channels Detail</span>
          </h3>
          <div className="space-y-4">
            {/* Razorpay Online */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Online Transactions (Razorpay)</span>
                <span className="text-slate-900 dark:text-white">₹{onlineRevenue.toLocaleString()} ({completedOrders.length > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completedOrders.length > 0 ? (onlineRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* COD */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Cash on Delivery (COD)</span>
                <span className="text-slate-900 dark:text-white">₹{codRevenue.toLocaleString()} ({completedOrders.length > 0 ? Math.round((codRevenue / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${completedOrders.length > 0 ? (codRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory low stock notifications */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 space-y-4 shadow-sm">
          <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Low Stock Alerts</span>
          </h3>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-2 text-xs">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((p) => (
                <div key={p._id} className="flex justify-between items-center border border-slate-200 dark:border-slate-880 rounded-xl p-3 bg-slate-100/10">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[200px]">{p.title}</span>
                  <div className="flex gap-1.5">
                    {p.sizes?.filter(s => s.stock <= 3).map((s, idx) => (
                      <span key={idx} className="rounded bg-red-500/10 px-2 py-0.5 font-bold text-red-500 border border-red-500/20">
                        {s.size}: {s.stock}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 p-4 border border-emerald-500/20 text-emerald-600">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>All product stock configurations are well supplied!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Sellers & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Best Selling & Purchased Products Card */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-bold text-slate-905 dark:text-white">Purchased Products Analytics</h3>
              <p className="text-[11px] text-slate-500">Track which products are being bought & total units sold</p>
            </div>
            <button
              onClick={() => setShowAllPurchases(!showAllPurchases)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20"
            >
              {showAllPurchases ? 'Show Top 5' : 'View All Bought'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Product Picture & Name</th>
                  <th className="pb-3 text-center">Units Sold</th>
                  <th className="pb-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40">
                {bestSellers.length > 0 ? (
                  bestSellers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-100/20 dark:hover:bg-slate-800/5 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <img
                          src={
                            item.image
                              ? item.image.startsWith('http')
                                ? item.image
                                : `http://localhost:5000/${item.image}`
                              : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=100'
                          }
                          alt={item.title}
                          className="h-12 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-850 dark:text-slate-200 block truncate max-w-[160px]" title={item.title}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-455">
                            Purchased in {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {item.unitsSold} units
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹{item.revenueGenerated.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-slate-450 italic">No sales transactions logged yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Overview table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
          <h3 className="text-md font-bold text-slate-905 dark:text-white mb-4">Recent Client Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40">
                {recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-100/20 dark:hover:bg-slate-800/5 transition-colors">
                    <td className="py-3.5 uppercase font-medium">#{o._id.substring(0, 10)}...</td>
                    <td className="py-3.5 truncate max-w-[100px]">{o.user?.name || 'Deleted Account'}</td>
                    <td className="py-3.5 font-bold">₹{o.totalAmount}</td>
                    <td className="py-3.5">
                      <span className={`capitalize font-semibold text-[10px] ${
                        o.orderStatus === 'delivered' ? 'text-emerald-505' : o.orderStatus === 'cancelled' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link to="/admin/orders" className="text-blue-500 hover:underline font-bold">Manage</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
