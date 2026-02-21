import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../core/services/api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Activity, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, Department } from '../../../core/models';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const initAuth = useAuthStore((state) => state.initAuth);
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

    if (formData.password !== formData.confirmPassword) {
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
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role as UserRole,
        department: formData.department as Department,
        phone: formData.phone || undefined
      });

      if (result.success) {
        toast.success('Account created successfully!');
        initAuth(); // Refresh auth state
        navigate('/dashboard');
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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Login
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-600">Join WebIMS Healthcare Platform</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  error={errors.fullName}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.doe@hospital.com"
                  error={errors.email}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="555-1234"
                />
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Security Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Security</h2>
              <div className="space-y-4">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  error={errors.password}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                By creating an account, you agree to WebIMS's Terms of Service and Privacy Policy.
                This is a demonstration system for educational purposes only.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-fit" isLoading={isLoading}>
              Create Account
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};