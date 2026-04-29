import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success) navigate('/dashboard');
    } else {
      const result = await register(formData.name, formData.email, formData.password, formData.role);
      if (result.success) navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-brand-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-800 via-brand-600 to-accent-500"></div>
        <div>
          <div className="mx-auto h-14 w-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-800 border border-brand-100 shadow-sm">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 font-serif tracking-tight">
            {isLogin ? 'Sign in to portal' : 'Register a new account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {isLogin ? 'Or ' : 'Already have an account? '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-brand-800 hover:text-brand-600 transition-colors">
              {isLogin ? 'create a new one' : 'sign in instead'}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-brand-800/20 focus:border-brand-800 sm:text-sm shadow-sm transition-all bg-gray-50 focus:bg-white"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                  <select
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:ring-brand-800/20 focus:border-brand-800 sm:text-sm shadow-sm transition-all bg-gray-50 focus:bg-white"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-brand-800/20 focus:border-brand-800 sm:text-sm shadow-sm transition-all bg-gray-50 focus:bg-white"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-brand-800/20 focus:border-brand-800 sm:text-sm shadow-sm transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-800 hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center pt-6 border-t border-gray-100">
          <button onClick={() => navigate('/admin-login')} className="text-xs font-medium text-gray-400 hover:text-brand-800 transition-colors uppercase tracking-wider">
            Admin Portal Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
