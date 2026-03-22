import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Activity, ShieldCheck, ArrowLeft } from 'lucide-react';

import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-100 via-white to-blue-50 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center lg:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
          <section className="hidden bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white lg:block">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <ShieldCheck size={14} className="mr-2" />
              Clinical-grade UX
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">Welcome back to WebIMS</h1>
            <p className="mt-4 text-sm leading-6 text-blue-100">
              A professional healthcare workspace designed for physicians, nurses, pharmacists, and operations teams.
            </p>

            <div className="mt-8 space-y-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => quickFill(account.email)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-left text-sm transition-colors hover:bg-white/20"
                >
                  <span className="font-semibold">{account.role}</span>
                  <span className="text-blue-100">{account.email}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-blue-100/90">
              Demo password for all seeded users: <span className="rounded bg-white/20 px-1.5 py-0.5 font-semibold">password</span>
            </p>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <Link
              to="/"
              className="mb-6 inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>

            <div className="mb-7">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <Activity className="text-white" size={24} />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Sign in to your workspace</h2>
              <p className="mt-1 text-sm text-slate-600">Use your clinical account credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@webims.com"
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <Button type="submit" className="w-full justify-center" isLoading={isLoading}>
                Sign In
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 lg:hidden">
              Demo password for seeded accounts: <span className="font-semibold">password</span>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New to WebIMS?{' '}
              <Link to="/signup" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Create Account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};