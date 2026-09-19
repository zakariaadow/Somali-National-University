import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const Attendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [units, setUnits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [lectureDate, setLectureDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);

  const queryParams = new URLSearchParams(location.search);
  const unitIdFromUrl = queryParams.get('unit_id');

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
        
        const unitsRes = await axios.get(`${API_BASE_URL}/lecturer/my-units`, {
          withCredentials: true
        });
        setUnits(unitsRes.data.units || []);
        
        const today = new Date().toISOString().split('T')[0];
        setLectureDate(today);
        
        if (unitIdFromUrl) {
          setSelectedUnit(unitIdFromUrl);
          await fetchStudents(unitIdFromUrl);
        }
        
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
      setAttendanceData(response.data.students.map(s => ({
        student_id: s.id,
        student_name: `${s.user?.first_name} ${s.user?.last_name}`,
        registration_number: s.registration_number,
        status: 'present',
        remarks: ''
      })));
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

  const handleStatusChange = (index, status) => {
    const updated = [...attendanceData];
    updated[index].status = status;
    setAttendanceData(updated);
  };

  const handleRemarkChange = (index, remarks) => {
    const updated = [...attendanceData];
    updated[index].remarks = remarks;
    setAttendanceData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit || !lectureDate) {
      setError('Please select a unit and date.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const attendancePayload = {
        unit_id: parseInt(selectedUnit),
        lecture_date: lectureDate,
        attendance: attendanceData.map(a => ({
          student_id: a.student_id,
          status: a.status,
          remarks: a.remarks || ''
        }))
      };

      const response = await axios.post(
        `${API_BASE_URL}/lecturer/record-attendance`,
        attendancePayload,
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError(err.response?.data?.error || 'Failed to record attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    excused: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Record Attendance</h1>
          <p className="text-gray-600">Record student attendance for your units.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Lecture Date *</label>
                <input
                  type="date"
                  value={lectureDate}
                  onChange={(e) => setLectureDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {selectedUnit && (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Students ({attendanceData.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.map((item, index) => (
                          <tr key={item.student_id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.registration_number}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.student_name}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                {['present', 'absent', 'excused'].map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(index, status)}
                                    className={`px-2 py-1 text-xs rounded transition ${
                                      item.status === status
                                        ? statusColors[status] + ' border-2 border-gray-400'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                placeholder="Remarks"
                                value={item.remarks}
                                onChange={(e) => handleRemarkChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || attendanceData.length === 0}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Attendance'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Attendance;