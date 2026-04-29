import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 w-full items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 transition-transform hover:-translate-y-0.5 group">
              <div className="bg-brand-800 p-2 rounded-xl shadow-inner group-hover:bg-brand-900 transition-colors">
                <BookOpen className="w-6 h-6 text-accent-400" />
              </div>
              <span className="font-serif text-2xl font-bold text-brand-900 tracking-tight">RIT <span className="text-accent-600">Library</span></span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-600 hover:text-brand-800 border-b-2 border-transparent hover:border-accent-500 transition-all">
              Library Collection
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-brand-800 flex items-center gap-1.5 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                {user.email === 'admin@library.com' && (
                  <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-brand-800 flex items-center gap-1.5 transition-colors">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-200 hover:border-red-200 px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-brand-800 hover:bg-brand-900 border border-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
