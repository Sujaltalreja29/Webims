import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { careNoteApi, residentApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Resident, ActivityType, CareNote } from '../../../core/models';
import {
  ArrowLeft, Save, Plus, Trash2, AlertCircle,
  Heart, Pill, Activity, CheckCircle,
  AlertTriangle, User, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES: ActivityType[] = [
  'Meal', 'Medication', 'Bath/Hygiene', 'Exercise',
  'Social Activity', 'Vital Signs', 'Wound Care', 'Physical Therapy', 'Other'
];

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  residentId: z.string().min(1, 'Resident is required'),
  shift:      z.enum(['Day', 'Evening', 'Night']),
  date:       z.string().min(1, 'Date is required'),
  startTime:  z.string().min(1, 'Start time is required'),
  endTime:    z.string().min(1, 'End time is required'),

  activities: z.array(z.object({
    type:        z.string(),
    description: z.string().min(1, 'Description required'),
    time:        z.string().min(1, 'Time required'),
    completed:   z.boolean()
  })),

  // Vitals (all optional)
  vBloodPressure:    z.string().optional(),
  vPulse:            z.string().optional(),
  vTemperature:      z.string().optional(),
  vWeight:           z.string().optional(),
  vOxygenSaturation: z.string().optional(),
  vRespiratoryRate:  z.string().optional(),
  vBloodSugar:       z.string().optional(),

  // Medications
  medications: z.array(z.object({
    medicationName:   z.string().min(1, 'Medication name required'),
    dosage:           z.string().min(1, 'Dosage required'),
    scheduledTime:    z.string().min(1, 'Scheduled time required'),
    administered:     z.boolean(),
    administeredTime: z.string().optional(),
    refusedReason:    z.string().optional(),
    notes:            z.string().optional()
  })),

  nutritionIntake:  z.enum(['Full', 'Partial', 'Minimal', 'None']),
  hydrationIntake:  z.enum(['Adequate', 'Limited', 'Poor']),
  painLevel:        z.number().min(0).max(10),
  mood:             z.enum(['Happy', 'Calm', 'Anxious', 'Agitated', 'Sad', 'Withdrawn']),

  behavioralNotes:  z.string().optional(),
  skinCondition:    z.string().optional(),
  eliminationNotes: z.string().optional(),
  alerts:           z.string().optional(),

  followUpNeeded:   z.boolean(),
  followUpReason:   z.string().optional()
});

type FormData = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────
export const NewCareNotePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const prefilledResidentId = searchParams.get('residentId') || '';

  const [residents, setResidents]     = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const {
    register, handleSubmit, control,
    watch, setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      residentId:      prefilledResidentId,
      shift:           'Day',
      date:            new Date().toISOString().split('T')[0],
      startTime:       '07:00',
      endTime:         '15:00',
      activities:      [],
      medications:     [],
      nutritionIntake: 'Full',
      hydrationIntake: 'Adequate',
      painLevel:       0,
      mood:            'Calm',
      followUpNeeded:  false
    }
  });

  const {
    fields: activityFields,
    append: appendActivity,
    remove: removeActivity
  } = useFieldArray({ control, name: 'activities' });

  const {
    fields: medFields,
    append: appendMed,
    remove: removeMed
  } = useFieldArray({ control, name: 'medications' });

  const watchedFollowUp   = watch('followUpNeeded');
  const watchedPainLevel  = watch('painLevel');
  const watchedResidentId = watch('residentId');

  // Keep form state synced with query param when navigating to this route
  // from pages like Residents without remounting the component.
  useEffect(() => {
    if (!prefilledResidentId) return;
    setValue('residentId', prefilledResidentId, { shouldValidate: true });
  }, [prefilledResidentId, setValue]);

  // ── Load residents ───────────────────────────────────────────────────
  useEffect(() => {
    const loadResidents = async () => {
      const activeResidents = await residentApi.getActive();

      if (!prefilledResidentId) {
        setResidents(activeResidents);
        return;
      }

      const prefilledActiveResident = activeResidents.find(r => r.id === prefilledResidentId);
      if (prefilledActiveResident) {
        setResidents(activeResidents);
        setSelectedResident(prefilledActiveResident);
        setValue('residentId', prefilledActiveResident.id, { shouldValidate: true });
        return;
      }

      const prefilledResident = await residentApi.getById(prefilledResidentId);
      if (prefilledResident) {
        setResidents([...activeResidents, prefilledResident]);
        setSelectedResident(prefilledResident);
        setValue('residentId', prefilledResident.id, { shouldValidate: true });
        return;
      }

      setResidents(activeResidents);
    };

    loadResidents();
  }, [prefilledResidentId, setValue]);

  // ── Update selected resident ─────────────────────────────────────────
  useEffect(() => {
    const found = residents.find(r => r.id === watchedResidentId);
    setSelectedResident(found || null);
  }, [watchedResidentId, residents]);

  // Re-apply prefilled resident after options are loaded so the native select
  // renders the selected option consistently.
  useEffect(() => {
    if (!prefilledResidentId || residents.length === 0) return;
    if (residents.some(r => r.id === prefilledResidentId)) {
      setValue('residentId', prefilledResidentId, { shouldValidate: true });
    }
  }, [prefilledResidentId, residents, setValue]);

  // ── Submit ───────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const allNotes = await careNoteApi.getAll();
      const nextId   = allNotes.length + 1;

      const newNote: CareNote = {
        id: `cn-${nextId}`,
        careNoteNumber: careNoteApi.generateCareNoteNumber(),
        residentId:  data.residentId,
        shift:       data.shift,
        date:        data.date,
        startTime:   data.startTime,
        endTime:     data.endTime,
        caregiverId: user.id,
        caregiverName: user.fullName,

        activities: data.activities.map(a => ({
          type:        a.type as ActivityType,
          description: a.description,
          time:        a.time,
          completed:   a.completed
        })),

        vitals: {
          bloodPressure:    data.vBloodPressure    || undefined,
          pulse:            data.vPulse            || undefined,
          temperature:      data.vTemperature      || undefined,
          weight:           data.vWeight           || undefined,
          oxygenSaturation: data.vOxygenSaturation || undefined,
          respiratoryRate:  data.vRespiratoryRate  || undefined,
          bloodSugar:       data.vBloodSugar       || undefined
        },

        medications: data.medications.map(m => ({
          medicationName:   m.medicationName,
          dosage:           m.dosage,
          scheduledTime:    m.scheduledTime,
          administered:     m.administered,
          administeredTime: m.administeredTime || undefined,
          refusedReason:    m.refusedReason    || undefined,
          notes:            m.notes            || undefined
        })),

        nutritionIntake:  data.nutritionIntake,
        hydrationIntake:  data.hydrationIntake,
        painLevel:        data.painLevel,
        mood:             data.mood,

        behavioralNotes:  data.behavioralNotes  || undefined,
        skinCondition:    data.skinCondition    || undefined,
        eliminationNotes: data.eliminationNotes || undefined,
        alerts:           data.alerts           || undefined,

        followUpNeeded: data.followUpNeeded,
        followUpReason: data.followUpReason || undefined,

        signedBy:  user.fullName,
        signedAt:  new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      await careNoteApi.create(newNote);
      toast.success('Care note saved successfully');
      navigate(`/ltc/care-notes/${newNote.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save care note');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls  = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectCls = inputCls;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/ltc/care-notes')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Care Note</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Document resident care for this shift
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ─ Shift Info ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <ClipboardList size={18} className="mr-2 text-blue-600" />
            Shift Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Resident */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Resident <span className="text-red-500">*</span>
              </label>
              <select {...register('residentId')} className={selectCls}>
                <option value="">Select resident...</option>
                {residents.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} — Room {r.roomNumber}{r.bedNumber}
                  </option>
                ))}
              </select>
              {errors.residentId && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle size={11} className="mr-1" />{errors.residentId.message}
                </p>
              )}
              {selectedResident && (
                <div className="mt-2 p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-xs">
                  <p className="font-medium text-purple-800">
                    {selectedResident.careLevel} · {selectedResident.mobilityStatus}
                  </p>
                  {selectedResident.allergies && (
                    <p className="text-red-600 mt-0.5">⚠ Allergies: {selectedResident.allergies}</p>
                  )}
                  {selectedResident.dietaryRestrictions && (
                    <p className="text-amber-700 mt-0.5">🍽 Diet: {selectedResident.dietaryRestrictions}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Shift <span className="text-red-500">*</span>
              </label>
              <select {...register('shift')} className={selectCls}>
                <option value="Day">Day (7am–3pm)</option>
                <option value="Evening">Evening (3pm–11pm)</option>
                <option value="Night">Night (11pm–7am)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('date')} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <input type="time" {...register('startTime')} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <input type="time" {...register('endTime')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* ─ Activities ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center">
              <Activity size={18} className="mr-2 text-green-600" />
              Activities Performed
            </h2>
            <button
              type="button"
              onClick={() => appendActivity({ type: 'Meal', description: '', time: '08:00', completed: true })}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center space-x-1"
            >
              <Plus size={14} /><span>Add Activity</span>
            </button>
          </div>

          {activityFields.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No activities added yet. Click "Add Activity" to start.
            </p>
          ) : (
            <div className="space-y-3">
              {activityFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {/* Type */}
                  <div className="col-span-3">
                    <select
                      {...register(`activities.${i}.type`)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      {...register(`activities.${i}.description`)}
                      placeholder="Description..."
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.activities?.[i]?.description && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.activities[i]?.description?.message}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="col-span-2">
                    <input
                      type="time"
                      {...register(`activities.${i}.time`)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Completed */}
                  <div className="col-span-1 flex items-center justify-center pt-1.5">
                    <input
                      type="checkbox"
                      {...register(`activities.${i}.completed`)}
                      className="w-4 h-4 text-green-600 border-slate-300 rounded"
                    />
                  </div>
                                    {/* Remove */}
                  <div className="col-span-1 flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => removeActivity(i)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-1">
                ✓ Checkbox = Activity completed
              </p>
            </div>
          )}
        </div>

        {/* ─ Vitals ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <Activity size={18} className="mr-2 text-red-500" />
            Vital Signs
            <span className="ml-2 text-sm font-normal text-slate-400">(all optional)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'vBloodPressure',    label: 'Blood Pressure', placeholder: '120/80' },
              { name: 'vPulse',            label: 'Pulse (bpm)',    placeholder: '72' },
              { name: 'vTemperature',      label: 'Temp (°F)',      placeholder: '98.6' },
              { name: 'vWeight',           label: 'Weight (lbs)',   placeholder: '150' },
              { name: 'vOxygenSaturation', label: 'O2 Saturation',  placeholder: '98%' },
              { name: 'vRespiratoryRate',  label: 'Resp. Rate',     placeholder: '16' },
              { name: 'vBloodSugar',       label: 'Blood Sugar',    placeholder: '100 mg/dL' }
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  {...register(field.name as any)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─ Medications ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center">
              <Pill size={18} className="mr-2 text-purple-600" />
              Medication Administration
            </h2>
            <button
              type="button"
              onClick={() => appendMed({
                medicationName: '',
                dosage: '',
                scheduledTime: '08:00',
                administered: true,
                administeredTime: '',
                refusedReason: '',
                notes: ''
              })}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 flex items-center space-x-1"
            >
              <Plus size={14} /><span>Add Medication</span>
            </button>
          </div>

          {medFields.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No medications added. Click "Add Medication" to record administration.
            </p>
          ) : (
            <div className="space-y-4">
              {medFields.map((field, i) => {
                const isAdministered = watch(`medications.${i}.administered`);
                return (
                  <div
                    key={field.id}
                    className={`rounded-lg border p-4 space-y-3 ${
                      isAdministered
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {/* Row 1: Name + Dosage + Scheduled Time + Administered toggle */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Medication Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register(`medications.${i}.medicationName`)}
                          placeholder="Lisinopril 10mg"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                        {errors.medications?.[i]?.medicationName && (
                          <p className="text-xs text-red-500 mt-0.5">
                            {errors.medications[i]?.medicationName?.message}
                          </p>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Dosage <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register(`medications.${i}.dosage`)}
                          placeholder="10mg"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Scheduled <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          {...register(`medications.${i}.scheduledTime`)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      {/* Administered Toggle */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                        <div className="flex items-center space-x-2">
                          <label className="relative cursor-pointer flex items-center space-x-2">
                            <input
                              type="checkbox"
                              {...register(`medications.${i}.administered`)}
                              className="w-4 h-4 text-green-600 border-slate-300 rounded"
                            />
                            <span className={`text-sm font-medium ${
                              isAdministered ? 'text-green-700' : 'text-red-600'
                            }`}>
                              {isAdministered ? '✓ Administered' : '✗ Not Given'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeMed(i)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Conditional fields */}
                    <div className="grid grid-cols-2 gap-3">
                      {isAdministered ? (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Administered Time
                          </label>
                          <input
                            type="time"
                            {...register(`medications.${i}.administeredTime`)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Reason Not Given
                          </label>
                          <input
                            type="text"
                            {...register(`medications.${i}.refusedReason`)}
                            placeholder="Refused, NPO, Held by MD..."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          {...register(`medications.${i}.notes`)}
                          placeholder="Any observations..."
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─ Nutrition & Hydration ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <Heart size={18} className="mr-2 text-orange-500" />
            Nutrition & Hydration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nutrition */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nutrition Intake <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Full', 'Partial', 'Minimal', 'None'] as const).map(level => (
                  <label key={level} className="relative cursor-pointer">
                    <input
                      type="radio"
                      value={level}
                      {...register('nutritionIntake')}
                      className="peer sr-only"
                    />
                    <div className={`border-2 rounded-lg p-2.5 text-center text-sm transition-all
                      peer-checked:font-semibold
                      ${level === 'Full'    ? 'peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700' :
                        level === 'Partial' ? 'peer-checked:border-yellow-500 peer-checked:bg-yellow-50 peer-checked:text-yellow-700' :
                        level === 'Minimal' ? 'peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700' :
                        'peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700'}
                      border-slate-200 text-slate-600 hover:border-slate-300`}
                    >
                      {level}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hydration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hydration Intake <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Adequate', 'Limited', 'Poor'] as const).map(level => (
                  <label key={level} className="relative cursor-pointer">
                    <input
                      type="radio"
                      value={level}
                      {...register('hydrationIntake')}
                      className="peer sr-only"
                    />
                    <div className={`border-2 rounded-lg p-2.5 text-center text-sm transition-all
                      peer-checked:font-semibold
                      ${level === 'Adequate' ? 'peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700' :
                        level === 'Limited'  ? 'peer-checked:border-yellow-500 peer-checked:bg-yellow-50 peer-checked:text-yellow-700' :
                        'peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700'}
                      border-slate-200 text-slate-600 hover:border-slate-300`}
                    >
                      {level}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─ Pain & Mood ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <User size={18} className="mr-2 text-blue-600" />
            Pain & Mood Assessment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Pain Scale */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Pain Level:{' '}
                <span className={`font-bold text-lg ${
                  watchedPainLevel === 0   ? 'text-green-600' :
                  watchedPainLevel <= 3    ? 'text-yellow-500' :
                  watchedPainLevel <= 6    ? 'text-orange-500' :
                  'text-red-600'
                }`}>
                  {watchedPainLevel}/10
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                {...register('painLevel', { valueAsNumber: true })}
                className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0 - No Pain</span>
                <span>5 - Moderate</span>
                <span>10 - Severe</span>
              </div>
              {watchedPainLevel >= 7 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <p className="text-xs text-red-700 font-medium">
                    High pain level — consider notifying charge nurse
                  </p>
                </div>
              )}
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Resident Mood <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'Happy',    emoji: '😊' },
                  { value: 'Calm',     emoji: '😌' },
                  { value: 'Anxious',  emoji: '😟' },
                  { value: 'Agitated', emoji: '😠' },
                  { value: 'Sad',      emoji: '😢' },
                  { value: 'Withdrawn',emoji: '😶' }
                ] as const).map(mood => (
                  <label key={mood.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      value={mood.value}
                      {...register('mood')}
                      className="peer sr-only"
                    />
                    <div className="border-2 border-slate-200 rounded-lg p-2 text-center text-xs hover:border-slate-300 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:font-semibold peer-checked:text-blue-700">
                      <div className="text-xl mb-0.5">{mood.emoji}</div>
                      {mood.value}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─ Clinical Observations ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center">
            <ClipboardList size={18} className="mr-2 text-slate-600" />
            Clinical Observations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Behavioral Notes
              </label>
              <textarea
                {...register('behavioralNotes')}
                rows={3}
                placeholder="Mood changes, confusion, agitation, notable behaviors..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Skin Condition
              </label>
              <textarea
                {...register('skinCondition')}
                rows={3}
                placeholder="Skin integrity, redness, wounds, edema..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Elimination Notes
              </label>
              <textarea
                {...register('eliminationNotes')}
                rows={2}
                placeholder="Bowel and bladder output, incontinence..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alerts / Urgent Notes
              </label>
              <textarea
                {...register('alerts')}
                rows={2}
                placeholder="Urgent observations requiring immediate attention..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ─ Follow-Up ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
            <AlertTriangle size={18} className="mr-2 text-amber-500" />
            Follow-Up Required
          </h2>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('followUpNeeded')}
              className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-slate-700">
              This note requires follow-up action
            </span>
          </label>

          {watchedFollowUp && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Follow-Up Reason / Instructions
              </label>
              <textarea
                {...register('followUpReason')}
                rows={3}
                placeholder="Describe what follow-up action is needed and who should be notified..."
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-amber-50"
              />
            </div>
          )}
        </div>

        {/* ─ Sign-off Banner ─ */}
        <div className="bg-slate-800 rounded-lg p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.fullName[0]}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.fullName}</p>
              <p className="text-slate-400 text-xs">
                {user?.role} · Signing off on this care note
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/ltc/care-notes')}
              className="px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-60 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Sign & Save Care Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};