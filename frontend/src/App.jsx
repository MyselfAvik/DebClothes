import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/customer/Home';
import ProductDetail from './pages/customer/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Customer Pages
import Profile from './pages/customer/Profile';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import AddEditProduct from './pages/admin/AddEditProduct';
import ManageOrders from './pages/admin/ManageOrders';
import SalesView from './pages/admin/SalesView';
import ManageCustomers from './pages/admin/ManageCustomers';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000 }} />
            <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 selection:bg-blue-550/20 dark:selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-200 transition-colors duration-300">
              <Navbar />
              <div className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />

                  {/* Customer Protected Routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <MyOrders />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Protected Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  >
                    {/* Nested Admin Paths */}
                    <Route index element={<ManageProducts />} />
                    <Route path="product/new" element={<AddEditProduct />} />
                    <Route path="product/:id/edit" element={<AddEditProduct />} />
                    <Route path="orders" element={<ManageOrders />} />
                    <Route path="sales" element={<SalesView />} />
                    <Route path="customers" element={<ManageCustomers />} />
                  </Route>

                  {/* 404 Route */}
                  <Route
                    path="*"
                    element={
                      <div className="flex flex-col h-[70vh] items-center justify-center text-center px-4">
                        <h1 className="text-6xl font-black text-blue-550 mb-4">404</h1>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</p>
                        <p className="text-slate-500 dark:text-slate-455 mb-6 max-w-sm">The URL path requested is invalid or has been relocated.</p>
                        <a href="/" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700">
                          Return to Shop
                        </a>
                      </div>
                    }
                  />
                </Routes>
              </div>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
