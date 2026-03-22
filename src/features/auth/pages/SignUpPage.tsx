import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../core/services/api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Activity, ArrowLeft, BadgeCheck, BriefcaseMedical } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, Department } from '../../../core/models';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const initAuth = useAuthStore((state) => state.initAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    department: '' as Department | '',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordStrength = useMemo(() => {
    const pass = formData.password;
    if (!pass) return { label: 'Not set', color: 'bg-slate-200', value: 0 };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', value: 25 };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', value: 50 };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', value: 75 };
    return { label: 'Strong', color: 'bg-emerald-500', value: 100 };
  }, [formData.password]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the highlighted form fields.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role as UserRole,
        department: formData.department as Department,
        phone: formData.phone || undefined
      });

      if (result.success) {
        toast.success('Account created successfully.');
        initAuth();
        navigate('/dashboard', { replace: true });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const roleOptions = [
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'BILLING', label: 'Billing Staff' },
    { value: 'PHARMACIST', label: 'Pharmacist' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  const departmentOptions = [
    { value: 'CLINIC', label: 'Clinic' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'BILLING', label: 'Billing' },
    { value: 'ADMIN', label: 'Administration' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-100 via-white to-cyan-50 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center lg:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-12">
          <section className="hidden border-r border-slate-200 bg-slate-50 p-8 lg:col-span-4 lg:block">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Create clinical workspace access</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Set up your role and department to enter the WebIMS demonstration environment.
            </p>

            <div className="mt-7 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="flex items-center text-sm font-semibold text-slate-800">
                  <BadgeCheck size={16} className="mr-2 text-emerald-600" />
                  Role-based modules
                </p>
                <p className="mt-1 text-xs text-slate-600">Menus and actions adapt to your assigned role automatically.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="flex items-center text-sm font-semibold text-slate-800">
                  <BriefcaseMedical size={16} className="mr-2 text-blue-600" />
                  Healthcare workflow simulation
                </p>
                <p className="mt-1 text-xs text-slate-600">Test appointment, clinical, lab, billing, pharmacy, and LTC flows.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:col-span-8 lg:p-10">
            <Link
              to="/"
              className="mb-6 inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h2>
            <p className="mt-1 text-sm text-slate-600">Provide your profile details to start using WebIMS.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Jane Doe"
                  error={errors.fullName}
                  autoComplete="name"
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="555-0101"
                  autoComplete="tel"
                />
              </div>

              <Input
                label="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="jane@webims.com"
                error={errors.email}
                autoComplete="email"
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  options={roleOptions}
                  error={errors.role}
                  required
                />
                <Select
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  options={departmentOptions}
                  error={errors.department}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="At least 6 characters"
                  error={errors.password}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Password Strength</span>
                  <span>{passwordStrength.label}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.value}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-slate-600">
                This demo registration stores user data in local browser storage and is intended for portfolio demonstration only.
              </div>

              <Button type="submit" className="w-full justify-center" isLoading={isLoading}>
                Create Account
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  Sign In
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
