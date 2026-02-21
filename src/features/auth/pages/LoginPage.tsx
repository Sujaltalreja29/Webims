import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Activity } from 'lucide-react';
import { Link } from "react-router-dom";

import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Doctor', email: 'doctor@webims.com' },
    { role: 'Nurse', email: 'nurse@webims.com' },
    { role: 'Receptionist', email: 'reception@webims.com' },
    { role: 'Billing', email: 'billing@webims.com' },
    { role: 'Pharmacist', email: 'pharmacist@webims.com' },
    { role: 'Admin', email: 'admin@webims.com' }
  ];

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WebIMS</h1>
          <p className="text-gray-600">Healthcare Information Management System</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              required
            />
            <Button type="submit" className="w-fit" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
      <div className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          Create Account
        </Link>

        {/* Demo Accounts Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <span className="text-lg mr-2">🎯</span>
            Demo Accounts (Click to auto-fill)
          </h3>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => quickFill(account.email)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-200"
              >
                <span className="text-sm font-medium text-gray-700">{account.role}</span>
                <span className="text-sm text-blue-600">{account.email}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Password: <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">password</span>
            </p>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};