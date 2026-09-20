import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const Assessments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [units, setUnits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [formData, setFormData] = useState({
    assessment_type: 'CAT1',
    assessment_date: '',
    max_marks: 30,
    weight: 30,
    student_marks: []
  });

  const queryParams = new URLSearchParams(location.search);
  const unitIdFromUrl = queryParams.get('unit_id');
  const studentIdFromUrl = queryParams.get('student_id');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Lecturer') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch lecturer's units
        const unitsRes = await axios.get(`${API_BASE_URL}/lecturer/my-units`, {
          withCredentials: true
        });
        setUnits(unitsRes.data.units || []);
        
        if (unitIdFromUrl) {
          setSelectedUnit(unitIdFromUrl);
          await fetchStudents(unitIdFromUrl);
        }
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, assessment_date: today }));
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, unitIdFromUrl]);

  const fetchStudents = async (unitId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lecturer/unit-students/${unitId}`, {
        withCredentials: true
      });
      setStudents(response.data.students || []);
      // Initialize student marks
      setFormData(prev => ({
        ...prev,
        student_marks: response.data.students.map(s => ({
          student_unit_id: s.id,
          student_name: `${s.user?.first_name} ${s.user?.last_name}`,
          registration_number: s.registration_number,
          marks: ''
        }))
      }));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students.');
    }
  };

  const handleUnitChange = async (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    if (unitId) {
      await fetchStudents(unitId);
    } else {
      setStudents([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMarkChange = (index, value) => {
    const updatedMarks = [...formData.student_marks];
    updatedMarks[index].marks = value;
    setFormData({ ...formData, student_marks: updatedMarks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const assessmentData = {
        unit_id: parseInt(selectedUnit),
        assessment_type: formData.assessment_type,
        assessment_date: formData.assessment_date,
        max_marks: parseFloat(formData.max_marks),
        weight: parseFloat(formData.weight),
        student_marks: formData.student_marks.map(sm => ({
          student_unit_id: sm.student_unit_id,
          marks: parseFloat(sm.marks) || 0
        }))
      };

      const response = await axios.post(
        `${API_BASE_URL}/lecturer/record-assessment`,
        assessmentData,
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(null), 3000);
        // Reset marks
        setFormData(prev => ({
          ...prev,
          student_marks: prev.student_marks.map(s => ({ ...s, marks: '' }))
        }));
      }
    } catch (err) {
      console.error('Error recording assessment:', err);
      setError(err.response?.data?.error || 'Failed to record assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Record Assessments</h1>
          <p className="text-gray-600">Record CATs, exams, and other assessments.</p>
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Select Unit *</label>
              <select
                value={selectedUnit}
                onChange={handleUnitChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a unit...</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_code} - {unit.unit_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedUnit && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assessment Type</label>
                    <select
                      name="assessment_type"
                      value={formData.assessment_type}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CAT1">CAT 1</option>
                      <option value="CAT2">CAT 2</option>
                      <option value="Exam">Exam</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      name="assessment_date"
                      value={formData.assessment_date}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Marks</label>
                    <input
                      type="number"
                      name="max_marks"
                      value={formData.max_marks}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Weight (%)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Student Marks</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {formData.student_marks.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">No students enrolled.</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.student_marks.map((sm, index) => (
                            <tr key={sm.student_unit_id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{sm.registration_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{sm.student_name}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={sm.marks}
                                  onChange={(e) => handleMarkChange(index, e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Score"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || formData.student_marks.length === 0}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Assessment'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Assessments;