import React from 'react';
import { useForm } from 'react-hook-form';
import { Patient } from '../../../core/models';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Button } from '../../../shared/components/ui/Button';
import { US_STATES } from '../../../core/constants/medical-codes';

interface PatientFormProps {
  initialData?: Partial<Patient>;
  onSubmit: (data: Partial<Patient>) => void;
  isLoading?: boolean;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: initialData || {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: undefined,
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      insurance: {
        type: 'Self-Pay',
        insuranceId: '',
        payerName: ''
      },
      flags: {
        hasAllergies: false,
        allergyList: '',
        isHighRisk: false
      }
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            {...register('firstName', { required: 'First name is required' })}
            error={errors.firstName?.message}
            required
          />
          <Input
            label="Last Name"
            {...register('lastName', { required: 'Last name is required' })}
            error={errors.lastName?.message}
            required
          />
          <Input
            label="Date of Birth"
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            error={errors.dateOfBirth?.message}
            required
          />
          <Select
            label="Gender"
            {...register('gender', { required: 'Gender is required' })}
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' }
            ]}
            error={errors.gender?.message}
            required
          />
          <Input
            label="Phone"
            type="tel"
            {...register('phone', { required: 'Phone is required' })}
            error={errors.phone?.message}
            placeholder="555-1234"
            required
          />
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="patient@email.com"
          />
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Street Address"
            {...register('address.street', { required: 'Street address is required' })}
            error={errors.address?.street?.message}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              {...register('address.city', { required: 'City is required' })}
              error={errors.address?.city?.message}
              required
            />
            <Select
              label="State"
              {...register('address.state', { required: 'State is required' })}
              options={US_STATES.map((state) => ({ value: state, label: state }))}
              error={errors.address?.state?.message}
              required
            />
            <Input
              label="ZIP Code"
              {...register('address.zipCode', { required: 'ZIP code is required' })}
              error={errors.address?.zipCode?.message}
              placeholder="12345"
              required
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Contact Name"
            {...register('emergencyContact.name')}
            placeholder="John Doe"
          />
          <Input
            label="Relationship"
            {...register('emergencyContact.relationship')}
            placeholder="Spouse, Parent, etc."
          />
          <Input
            label="Contact Phone"
            type="tel"
            {...register('emergencyContact.phone')}
            placeholder="555-1234"
          />
        </div>
      </div>

      {/* Insurance Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Insurance Type"
            {...register('insurance.type', { required: 'Insurance type is required' })}
            options={[
              { value: 'Medicare', label: 'Medicare' },
              { value: 'Medicaid', label: 'Medicaid' },
              { value: 'Private', label: 'Private Insurance' },
              { value: 'Self-Pay', label: 'Self-Pay' }
            ]}
            error={errors.insurance?.type?.message}
            required
          />
          <Input
            label="Insurance ID"
            {...register('insurance.insuranceId')}
            placeholder="INS123456"
          />
          <Input
            label="Payer Name"
            {...register('insurance.payerName')}
            placeholder="Blue Cross, Aetna, etc."
          />
        </div>
      </div>

      {/* Medical Flags */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Alerts</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('flags.hasAllergies')}
              className="mt-1 mr-3"
              id="hasAllergies"
            />
            <div className="flex-1">
              <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700 cursor-pointer">
                Patient has known allergies
              </label>
              <Input
                {...register('flags.allergyList')}
                placeholder="List allergies (e.g., Penicillin, Latex)"
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('flags.isHighRisk')}
              className="mr-3"
              id="isHighRisk"
            />
            <label htmlFor="isHighRisk" className="text-sm font-medium text-gray-700 cursor-pointer">
              Flag as high-risk patient
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Patient' : 'Register Patient'}
        </Button>
      </div>
    </form>
  );
};