import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FinanceFeeStructures = () => {
  const navigate = useNavigate();
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    programme_id: '',
    semester_id: '',
    academic_year_id: '',
    tuition_fee: '',
    registration_fee: '',
    examination_fee: '',
    student_card_fee: '',
    library_fee: '',
    sports_fee: '',
    medical_fee: '',
    other_fees: '',
    currency: 'USD'
  });
  const [programmes, setProgrammes] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Finance Officer') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feeRes, programmesRes, semestersRes, yearsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/fee-structures`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/programmes`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/semesters`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/academic-years`, { withCredentials: true })
      ]);
      setFeeStructures(feeRes.data.fee_structures || []);
      setProgrammes(programmesRes.data.programmes || []);
      setSemesters(semestersRes.data.semesters || []);
      setAcademicYears(yearsRes.data.academic_years || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load fee structures.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        ...formData,
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        examination_fee: parseFloat(formData.examination_fee) || 0,
        student_card_fee: parseFloat(formData.student_card_fee) || 0,
        library_fee: parseFloat(formData.library_fee) || 0,
        sports_fee: parseFloat(formData.sports_fee) || 0,
        medical_fee: parseFloat(formData.medical_fee) || 0,
        other_fees: parseFloat(formData.other_fees) || 0
      };

      const url = editing 
        ? `${API_BASE_URL}/fee-structures/${editing}` 
        : `${API_BASE_URL}/fee-structures`;
      const method = editing ? 'put' : 'post';

      const response = await axios[method](url, data, { withCredentials: true });

      if (response.data.message) {
        setSuccess(editing ? 'Fee structure updated successfully!' : 'Fee structure created successfully!');
        await fetchData();
        resetForm();
        setShowModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving fee structure:', err);
      setError(err.response?.data?.error || 'Failed to save fee structure.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fee) => {
    setEditing(fee.id);
    setFormData({
      name: fee.name || '',
      programme_id: fee.programme_id || '',
      semester_id: fee.semester_id || '',
      academic_year_id: fee.academic_year_id || '',
      tuition_fee: fee.tuition_fee || '',
      registration_fee: fee.registration_fee || '',
      examination_fee: fee.examination_fee || '',
      student_card_fee: fee.student_card_fee || '',
      library_fee: fee.library_fee || '',
      sports_fee: fee.sports_fee || '',
      medical_fee: fee.medical_fee || '',
      other_fees: fee.other_fees || '',
      currency: fee.currency || 'USD'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      programme_id: '',
      semester_id: '',
      academic_year_id: '',
      tuition_fee: '',
      registration_fee: '',
      examination_fee: '',
      student_card_fee: '',
      library_fee: '',
      sports_fee: '',
      medical_fee: '',
      other_fees: '',
      currency: 'USD'
    });
  };

  const calculateTotal = () => {
    const total = 
      parseFloat(formData.tuition_fee || 0) +
      parseFloat(formData.registration_fee || 0) +
      parseFloat(formData.examination_fee || 0) +
      parseFloat(formData.student_card_fee || 0) +
      parseFloat(formData.library_fee || 0) +
      parseFloat(formData.sports_fee || 0) +
      parseFloat(formData.medical_fee || 0) +
      parseFloat(formData.other_fees || 0);
    return total.toFixed(2);
  };

  if (loading && !showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading fee structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
              <p className="text-gray-600">Manage fee structures for programmes</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Fee Structure
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeStructures.map((fee) => (
            <div key={fee.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{fee.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  fee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {fee.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{fee.programme_name}</p>
              <p className="text-sm text-gray-500">{fee.semester_name} - {fee.academic_year}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-lg font-bold text-blue-600">${fee.total_fee?.toFixed(2)}</p>
                <button
                  onClick={() => handleEdit(fee)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Fee Structure' : 'New Fee Structure'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Programme *</label>
                  <select
                    name="programme_id"
                    value={formData.programme_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Programme</option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester *</label>
                  <select
                    name="semester_id"
                    value={formData.semester_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                <select
                  name="academic_year_id"
                  value={formData.academic_year_id}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tuition Fee</label>
                  <input
                    type="number"
                    name="tuition_fee"
                    value={formData.tuition_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Fee</label>
                  <input
                    type="number"
                    name="registration_fee"
                    value={formData.registration_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Examination Fee</label>
                  <input
                    type="number"
                    name="examination_fee"
                    value={formData.examination_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Card Fee</label>
                  <input
                    type="number"
                    name="student_card_fee"
                    value={formData.student_card_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Library Fee</label>
                  <input
                    type="number"
                    name="library_fee"
                    value={formData.library_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sports Fee</label>
                  <input
                    type="number"
                    name="sports_fee"
                    value={formData.sports_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical Fee</label>
                  <input
                    type="number"
                    name="medical_fee"
                    value={formData.medical_fee}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other Fees</label>
                  <input
                    type="number"
                    name="other_fees"
                    value={formData.other_fees}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Fee:</span>
                  <span className="text-2xl font-bold text-blue-600">${calculateTotal()}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceFeeStructures;