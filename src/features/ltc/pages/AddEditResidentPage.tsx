import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { residentApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Resident } from '../../../core/models';
import {
  ArrowLeft, Save, User, Heart,
  Phone, AlertCircle, Building2
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  firstName:    z.string().min(1, 'First name is required'),
  lastName:     z.string().min(1, 'Last name is required'),
  dateOfBirth:  z.string().min(1, 'Date of birth is required'),
  gender:       z.enum(['Male', 'Female', 'Other']),
  phone:        z.string().optional(),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),

  emergencyContactName:         z.string().min(1, 'Emergency contact name is required'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
  emergencyContactPhone:        z.string().min(1, 'Emergency contact phone is required'),

  admissionDate: z.string().min(1, 'Admission date is required'),
  roomNumber:    z.string().min(1, 'Room number is required'),
  bedNumber:     z.string().min(1, 'Bed number is required'),

  careLevel:      z.enum(['Independent', 'Assisted', 'Skilled Nursing', 'Memory Care']),
  mobilityStatus: z.enum(['Independent', 'Walker', 'Wheelchair', 'Bedridden']),
  cognitiveStatus:z.enum(['Alert', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment']),

  medicalConditionsRaw: z.string().optional(),
  allergies:            z.string().optional(),
  primaryPhysician:     z.string().optional(),
  dietaryRestrictions:  z.string().optional(),
  dnrStatus:            z.boolean(),

  insuranceType: z.string().optional(),
  insuranceId:   z.string().optional(),

  notes: z.string().optional()
});

type FormData = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────
export const AddEditResidentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'Female',
      careLevel: 'Assisted',
      mobilityStatus: 'Independent',
      cognitiveStatus: 'Alert',
      dnrStatus: false,
      admissionDate: new Date().toISOString().split('T')[0]
    }
  });

  // ── Load for edit ────────────────────────────────────────────────────
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      residentApi.getById(id).then(res => {
        if (!res) { navigate('/ltc/residents'); return; }
        reset({
          firstName:    res.firstName,
          lastName:     res.lastName,
          dateOfBirth:  res.dateOfBirth,
          gender:       res.gender,
          phone:        res.phone || '',
          email:        res.email || '',

          emergencyContactName:         res.emergencyContact.name,
          emergencyContactRelationship: res.emergencyContact.relationship,
          emergencyContactPhone:        res.emergencyContact.phone,

          admissionDate: res.admissionDate,
          roomNumber:    res.roomNumber,
          bedNumber:     res.bedNumber,

          careLevel:      res.careLevel,
          mobilityStatus: res.mobilityStatus,
          cognitiveStatus:res.cognitiveStatus,

          medicalConditionsRaw: res.medicalConditions.join(', '),
          allergies:            res.allergies || '',
          primaryPhysician:     res.primaryPhysician || '',
          dietaryRestrictions:  res.dietaryRestrictions || '',
          dnrStatus:            res.dnrStatus,

          insuranceType: res.insuranceType || '',
          insuranceId:   res.insuranceId || '',
          notes:         res.notes || ''
        });
        setLoading(false);
      });
    }
  }, [id]);

  // ── Submit ───────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const medicalConditions = data.medicalConditionsRaw
        ? data.medicalConditionsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const residentData: Partial<Resident> = {
        firstName:   data.firstName,
        lastName:    data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender:      data.gender,
        phone:       data.phone || undefined,
        email:       data.email || undefined,
        emergencyContact: {
          name:         data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phone:        data.emergencyContactPhone
        },
        admissionDate: data.admissionDate,
        roomNumber:    data.roomNumber,
        bedNumber:     data.bedNumber,
        careLevel:     data.careLevel,
        mobilityStatus:  data.mobilityStatus,
        cognitiveStatus: data.cognitiveStatus,
        medicalConditions,
        allergies:          data.allergies || undefined,
        primaryPhysician:   data.primaryPhysician || undefined,
        dietaryRestrictions:data.dietaryRestrictions || undefined,
        dnrStatus:    data.dnrStatus,
        insuranceType:data.insuranceType || undefined,
        insuranceId:  data.insuranceId || undefined,
        notes:        data.notes || undefined
      };

      if (isEdit && id) {
        await residentApi.update(id, { ...residentData, updatedAt: new Date().toISOString() });
        toast.success('Resident updated successfully');
        navigate(`/ltc/residents/${id}`);
      } else {
        const all = await residentApi.getAll();
        const nextId = all.length + 1;
        await residentApi.create({
          ...residentData,
          id: `resident-${nextId}`,
          residentNumber: residentApi.generateResidentNumber(),
          status: 'Active',
          createdAt: new Date().toISOString(),
          createdBy: user.id
        } as Resident);
        toast.success('Resident admitted successfully');
        navigate('/ltc/residents');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save resident');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ─── Helper: form field ────────────────────────────────────────────────
  const Field = ({
    label, error, required = false, children
  }: {
    label: string; error?: string; required?: boolean; children: React.ReactNode
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center">
          <AlertCircle size={11} className="mr-1" />{error}
        </p>
      )}
    </div>
  );

  const inputCls = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectCls = inputCls;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(isEdit ? `/ltc/residents/${id}` : '/ltc/residents')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Edit Resident' : 'Admit New Resident'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isEdit ? 'Update resident information' : 'Complete all required fields to admit a new resident'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ─ Personal Information ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <User size={18} className="mr-2 text-blue-600" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="First Name" required error={errors.firstName?.message}>
              <input type="text" {...register('firstName')} className={inputCls} placeholder="First name" />
            </Field>

            <Field label="Last Name" required error={errors.lastName?.message}>
              <input type="text" {...register('lastName')} className={inputCls} placeholder="Last name" />
            </Field>

            <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
              <input type="date" {...register('dateOfBirth')} className={inputCls} />
            </Field>

            <Field label="Gender" required error={errors.gender?.message}>
              <select {...register('gender')} className={selectCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <Field label="Phone Number" error={errors.phone?.message}>
              <input type="tel" {...register('phone')} className={inputCls} placeholder="555-0000" />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <input type="email" {...register('email')} className={inputCls} placeholder="optional" />
            </Field>
          </div>
        </div>

        {/* ─ Emergency Contact ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <Phone size={18} className="mr-2 text-red-500" />
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Contact Name" required error={errors.emergencyContactName?.message}>
              <input type="text" {...register('emergencyContactName')} className={inputCls} placeholder="Full name" />
            </Field>
            <Field label="Relationship" required error={errors.emergencyContactRelationship?.message}>
              <input type="text" {...register('emergencyContactRelationship')} className={inputCls} placeholder="Son, Daughter, Spouse..." />
            </Field>
            <Field label="Phone" required error={errors.emergencyContactPhone?.message}>
              <input type="tel" {...register('emergencyContactPhone')} className={inputCls} placeholder="555-0000" />
            </Field>
          </div>
        </div>

        {/* ─ Admission & Room ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <Building2 size={18} className="mr-2 text-purple-600" />
            Admission & Room Assignment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Admission Date" required error={errors.admissionDate?.message}>
              <input type="date" {...register('admissionDate')} className={inputCls} />
            </Field>
            <Field label="Room Number" required error={errors.roomNumber?.message}>
              <input type="text" {...register('roomNumber')} className={inputCls} placeholder="101" />
            </Field>
            <Field label="Bed" required error={errors.bedNumber?.message}>
              <select {...register('bedNumber')} className={selectCls}>
                <option value="A">Bed A</option>
                <option value="B">Bed B</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ─ Care Assessment ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <Heart size={18} className="mr-2 text-pink-500" />
            Care Assessment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Care Level" required error={errors.careLevel?.message}>
              <select {...register('careLevel')} className={selectCls}>
                <option value="Independent">Independent</option>
                <option value="Assisted">Assisted</option>
                <option value="Skilled Nursing">Skilled Nursing</option>
                <option value="Memory Care">Memory Care</option>
              </select>
            </Field>

            <Field label="Mobility Status" required error={errors.mobilityStatus?.message}>
              <select {...register('mobilityStatus')} className={selectCls}>
                <option value="Independent">Independent</option>
                <option value="Walker">Walker</option>
                <option value="Wheelchair">Wheelchair</option>
                <option value="Bedridden">Bedridden</option>
              </select>
            </Field>

            <Field label="Cognitive Status" required error={errors.cognitiveStatus?.message}>
              <select {...register('cognitiveStatus')} className={selectCls}>
                <option value="Alert">Alert & Oriented</option>
                <option value="Mild Impairment">Mild Impairment</option>
                <option value="Moderate Impairment">Moderate Impairment</option>
                <option value="Severe Impairment">Severe Impairment</option>
              </select>
            </Field>

            <Field label="Primary Physician" error={errors.primaryPhysician?.message}>
              <input type="text" {...register('primaryPhysician')} className={inputCls} placeholder="Dr. Name" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Medical Conditions" error={errors.medicalConditionsRaw?.message}>
                <input
                  type="text"
                  {...register('medicalConditionsRaw')}
                  className={inputCls}
                  placeholder="Comma separated: Hypertension, Diabetes, COPD..."
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple conditions with commas</p>
              </Field>
            </div>

            <Field label="Allergies" error={errors.allergies?.message}>
              <input type="text" {...register('allergies')} className={inputCls} placeholder="Penicillin, Sulfa..." />
            </Field>

            <Field label="Dietary Restrictions" error={errors.dietaryRestrictions?.message}>
              <input type="text" {...register('dietaryRestrictions')} className={inputCls} placeholder="Low sodium, diabetic diet..." />
            </Field>

            {/* DNR */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('dnrStatus')}
                  className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">DNR Status (Do Not Resuscitate)</span>
                  <p className="text-xs text-slate-400">Check if resident has a valid DNR order on file</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ─ Insurance ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Insurance Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Insurance Type" error={errors.insuranceType?.message}>
              <select {...register('insuranceType')} className={selectCls}>
                <option value="">Select type...</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Private">Private Insurance</option>
                <option value="Self-Pay">Self-Pay</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Insurance ID / Member Number" error={errors.insuranceId?.message}>
              <input type="text" {...register('insuranceId')} className={inputCls} placeholder="Insurance ID" />
            </Field>
          </div>
        </div>

        {/* ─ Notes ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Additional Notes</h2>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder="Preferences, important observations, family instructions..."
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* ─ Actions ─ */}
        <div className="flex justify-end space-x-3 pb-6">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/ltc/residents/${id}` : '/ltc/residents')}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-60 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEdit ? 'Update Resident' : 'Admit Resident'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};