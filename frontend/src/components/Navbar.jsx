import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ShoppingCart, LogOut, LayoutDashboard, Sun, Moon, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  // Mobile menu open/close toggle state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
    navigate('/');
  };

  return (
    <nav className="glass-nav sticky top-0 z-50 px-4 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex max-w-7xl flex-col">
        {/* Main header row */}
        <div className="flex items-center justify-between">
          {/* Logo & Burger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white md:hidden"
              title="Toggle Menu"
            >
              {showMobileMenu ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>

            <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
              <ShoppingBag className="h-5.5 w-5.5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-slate-900 dark:text-white">
                DEB<span className="text-blue-500">CLOTHES</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-blue-500 ${
                  isActive ? 'text-blue-500 nav-link-active' : 'text-slate-600 dark:text-slate-300'
                }`
              }
            >
              Shop
            </NavLink>
            {user && user.role === 'customer' && (
              <>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-blue-500 ${
                      isActive ? 'text-blue-500 nav-link-active' : 'text-slate-600 dark:text-slate-300'
                    }`
                  }
                >
                  My Orders
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-blue-500 ${
                      isActive ? 'text-blue-500 nav-link-active' : 'text-slate-600 dark:text-slate-300'
                    }`
                  }
                >
                  Profile
                </NavLink>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Cart Icon (Customer Only or Guest) */}
            {(!user || user.role === 'customer') && (
              <Link to="/cart" className="relative text-slate-500 dark:text-slate-300 transition-colors hover:text-blue-550 dark:hover:text-blue-455 mr-1">
                <ShoppingCart className="h-5 w-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm transition-all animate-pulse">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop User Account Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Link */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 px-2.5 py-1.5 text-xs font-semibold text-blue-500 dark:text-blue-400 border border-blue-500/20 transition-all hover:bg-blue-600/20"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">Dashboard</span>
                    </Link>
                  )}

                  {/* User Identity / Info Link */}
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="rounded-full bg-blue-500/10 p-1.5 text-blue-550 border border-blue-550/20 group-hover:bg-blue-550 group-hover:text-white transition-all duration-300">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="hidden flex-col items-start lg:flex">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-500 transition-colors">{user.name}</span>
                      <span className="text-[10px] text-slate-455 dark:text-slate-450 capitalize">{user.role}</span>
                    </div>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 dark:text-slate-355 transition-colors hover:text-slate-900 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-805"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Mobile Nav links dropdown drawer */}
        {showMobileMenu && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white/90 dark:bg-[#0f172a]/90 p-3 shadow-xl backdrop-blur-md md:hidden transition-all duration-300">
            <NavLink
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`
              }
            >
              Shop Catalog
            </NavLink>
            {user && user.role === 'customer' && (
              <>
                <NavLink
                  to="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  My Orders
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  Profile
                </NavLink>
              </>
            )}
            {user && user.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                Admin Dashboard
              </NavLink>
            )}

            {/* Mobile Authentication / User Profile Actions */}
            <hr className="my-2 border-slate-200 dark:border-slate-800" />
            
            {user ? (
              <div className="flex flex-col gap-2">
                {/* User Identity Info */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="rounded-full bg-blue-500/10 p-1.5 text-blue-550 border border-blue-550/20">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-750 dark:text-slate-200">{user.name}</span>
                    <span className="text-[10px] text-slate-455 dark:text-slate-450 capitalize">{user.role}</span>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-1">
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-center rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
