import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const AdminFeeStructures = () => {
  const navigate = useNavigate();
  const [feeStructures, setFeeStructures] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    programme_id: '',
    semester_id: '',
    academic_year_id: '',
    tuition_fee: 0,
    registration_fee: 0,
    examination_fee: 0,
    student_card_fee: 0,
    library_fee: 0,
    sports_fee: 0,
    medical_fee: 0,
    other_fees: 0,
    currency: 'SOS'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
      navigate('/login');
      return;
    }

    fetchProgrammes();
    fetchSemesters();
    fetchAcademicYears();
    fetchFeeStructures();
  }, [navigate]);

  const fetchProgrammes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/programmes?is_active=true`, {
        withCredentials: true
      });
      setProgrammes(response.data.programmes || []);
    } catch (err) {
      console.error('Error fetching programmes:', err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/semesters?is_active=true`, {
        withCredentials: true
      });
      setSemesters(response.data.semesters || []);
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/academic-years?is_active=true`, {
        withCredentials: true
      });
      setAcademicYears(response.data.academic_years || []);
    } catch (err) {
      console.error('Error fetching academic years:', err);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/fee-structures?is_active=true`, {
        withCredentials: true
      });
      setFeeStructures(response.data.fee_structures || []);
    } catch (err) {
      console.error('Error fetching fee structures:', err);
      setError('Failed to load fee structures.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        programme_id: parseInt(formData.programme_id),
        semester_id: parseInt(formData.semester_id),
        academic_year_id: parseInt(formData.academic_year_id),
        total_fee: formData.tuition_fee + formData.registration_fee + formData.examination_fee + 
                   formData.student_card_fee + formData.library_fee + formData.sports_fee + 
                   formData.medical_fee + formData.other_fees
      };
      if (editingFee) {
        await axios.put(
          `${API_BASE_URL}/fee-structures/${editingFee.id}`,
          data,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/fee-structures`,
          data,
          { withCredentials: true }
        );
      }
      setShowModal(false);
      resetForm();
      fetchFeeStructures();
    } catch (err) {
      console.error('Error saving fee structure:', err);
      setError(err.response?.data?.error || 'Failed to save fee structure.');
    }
  };

  const handleEdit = (fee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      programme_id: fee.programme_id,
      semester_id: fee.semester_id,
      academic_year_id: fee.academic_year_id,
      tuition_fee: fee.tuition_fee || 0,
      registration_fee: fee.registration_fee || 0,
      examination_fee: fee.examination_fee || 0,
      student_card_fee: fee.student_card_fee || 0,
      library_fee: fee.library_fee || 0,
      sports_fee: fee.sports_fee || 0,
      medical_fee: fee.medical_fee || 0,
      other_fees: fee.other_fees || 0,
      currency: fee.currency || 'SOS'
    });
    setShowModal(true);
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/fee-structures/${feeId}`, { withCredentials: true });
      fetchFeeStructures();
    } catch (err) {
      console.error('Error deleting fee structure:', err);
      setError('Failed to delete fee structure.');
    }
  };

  const resetForm = () => {
    setEditingFee(null);
    setFormData({
      name: '',
      programme_id: '',
      semester_id: '',
      academic_year_id: '',
      tuition_fee: 0,
      registration_fee: 0,
      examination_fee: 0,
      student_card_fee: 0,
      library_fee: 0,
      sports_fee: 0,
      medical_fee: 0,
      other_fees: 0,
      currency: 'SOS'
    });
  };

  if (loading) {
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
              <p className="text-gray-600">Manage fee structures for programmes</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Add Fee Structure
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Fee Structures Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {feeStructures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No fee structures found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeStructures.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.programme_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.semester_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fee.currency} {fee.total_fee?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fee Structure Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
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
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
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
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
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
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SOS">SOS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    {editingFee ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeeStructures;