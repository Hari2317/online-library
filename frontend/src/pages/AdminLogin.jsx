import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: 'admin@library.com',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      if (result.user.role === 'librarian') {
        toast.success('Admin authenticated');
        navigate('/admin');
      } else {
        toast.error('Unauthorized. Missing Administrator clearance.');
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-brand-950 rounded-[2.5rem] mt-8 shadow-2xl border border-brand-800/50 relative overflow-hidden">
      <div className="max-w-md w-full space-y-8 bg-brand-900/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-brand-700/50">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-brand-800 to-brand-600 border border-brand-500/30 rounded-2xl flex items-center justify-center text-accent-400 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transform rotate-3 transition-transform hover:rotate-6">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-tight font-serif">
            Administrator Gateway
          </h2>
          <p className="mt-2 text-center text-sm text-brand-200/70">
            Secure login for library administrators
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1">Admin Email</label>
              <input
                type="email"
                required
                readOnly
                className="appearance-none relative block w-full px-4 py-3.5 bg-brand-900/80 border border-brand-700/50 text-gray-400 rounded-xl sm:text-sm cursor-not-allowed shadow-inner focus:outline-none"
                value={formData.email}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3.5 bg-brand-800/50 border border-brand-600 placeholder-brand-400/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 sm:text-sm transition-all shadow-inner"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-brand-950 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 focus:ring-offset-brand-900 transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:shadow-[0_0_25px_rgba(197,160,89,0.5)] transform hover:-translate-y-0.5"
            >
              Authenticate & Enter
            </button>
          </div>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-brand-800 pb-2">
          <button onClick={() => navigate('/login')} className="text-xs font-semibold tracking-wider text-brand-300 hover:text-white transition-colors uppercase">
            ← Return to Standard Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
