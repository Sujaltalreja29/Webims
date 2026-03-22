import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../../core/services/api';
import { Patient } from '../../../core/models';
import { SearchBar } from '../../../shared/components/SearchBar';
import { 
  Plus, Eye, Edit, Trash2, Download, Filter, 
  AlertCircle, User, Phone, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PageShell } from '../../../shared/components/PageShell';
import { LoadingState } from '../../../shared/components/states/LoadingState';
import { EmptyState } from '../../../shared/components/states/EmptyState';

export const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'allergies' | 'high-risk'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients, filterType]);

  const loadPatients = async () => {
    try {
      const data = await patientApi.getActivePatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(term) ||
          p.lastName.toLowerCase().includes(term) ||
          p.mrn.toLowerCase().includes(term) ||
          p.phone.includes(term)
      );
    }

    // Apply type filter
    if (filterType === 'allergies') {
      filtered = filtered.filter(p => p.flags.hasAllergies);
    } else if (filterType === 'high-risk') {
      filtered = filtered.filter(p => p.flags.isHighRisk);
    }

    setFilteredPatients(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s record?`)) return;

    try {
      await patientApi.delete(id);
      toast.success('Patient record deleted');
      loadPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInsuranceBadgeColor = (type: string) => {
    const colors: any = {
      'Medicare': 'bg-blue-100 text-blue-700 border-blue-200',
      'Medicaid': 'bg-green-100 text-green-700 border-green-200',
      'Private': 'bg-purple-100 text-purple-700 border-purple-200',
      'Self-Pay': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <LoadingState message="Loading patient registry..." className="h-96" />;
  }

  return (
    <PageShell
      title="Patient Registry"
      subtitle="Manage patient demographics and records"
      actions={(
        <>
          <button className="flex items-center space-x-2 rounded-lg border border-slate-300 bg-white px-4 py-2 transition-colors hover:bg-slate-50">
            <Download size={18} />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button
            onClick={() => navigate('/patients/new')}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Register Patient</span>
          </button>
        </>
      )}
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Patients</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{patients.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Patients</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {patients.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">With Allergies</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {patients.filter(p => p.flags.hasAllergies).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">High Risk</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {patients.filter(p => p.flags.isHighRisk).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, MRN, or phone..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-slate-500" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('allergies')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'allergies'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Allergies
            </button>
            <button
              onClick={() => setFilterType('high-risk')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'high-risk'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              High Risk
            </button>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={searchTerm ? 'No patients match your search' : 'No patients registered yet'}
              description={
                searchTerm
                  ? 'Try a different name, MRN, or phone number.'
                  : 'Create your first patient record to start scheduling and clinical workflows.'
              }
              icon={<User size={26} />}
              action={
                !searchTerm ? (
                  <button
                    onClick={() => navigate('/patients/new')}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Register First Patient
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    MRN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Insurance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Alerts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Registered {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-700">{patient.mrn}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-slate-700">
                          <Phone size={14} className="mr-2 text-slate-400" />
                          {patient.phone}
                        </div>
                        {patient.email && (
                          <div className="text-xs text-slate-500">{patient.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-700">
                        <Calendar size={14} className="mr-2 text-slate-400" />
                        {calculateAge(patient.dateOfBirth)} yrs / {patient.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getInsuranceBadgeColor(patient.insurance.type)}`}>
                        {patient.insurance.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {patient.flags.hasAllergies && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            <AlertCircle size={12} className="mr-1" />
                            Allergies
                          </span>
                        )}
                        {patient.flags.isHighRisk && (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            <AlertCircle size={12} className="mr-1" />
                            High Risk
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredPatients.length > 0 && (
        <div className="text-center text-sm text-slate-600">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      )}
    </PageShell>
  );
};