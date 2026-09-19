import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Students = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get('unit_id');
  
  const [students, setStudents] = useState([]);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (unitId) {
          // Fetch students for specific unit
          const response = await axios.get(`${API_BASE_URL}/lecturer/unit-students/${unitId}`, {
            withCredentials: true
          });
          setStudents(response.data.students || []);
          
          // Get unit info
          const unitRes = await axios.get(`${API_BASE_URL}/units/${unitId}`, {
            withCredentials: true
          });
          setUnit(unitRes.data.unit);
        } else {
          // Fetch all students (if needed)
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load students.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, unitId]);

  const filteredStudents = students.filter(student =>
    student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {unit ? `${unit.unit_code} - ${unit.unit_name}` : 'My Students'}
          </h1>
          <p className="text-gray-600">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
            <p>No students enrolled in this unit.</p>
            {!unitId && <p className="text-sm mt-2">Select a unit to view its students.</p>}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.registration_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.user?.first_name} {student.user?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.programme_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Year {student.year_of_study}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link to={`/lecturer/assessments?student_id=${student.id}`} className="text-blue-600 hover:underline">
                        Assessments
                      </Link>
                      <Link to={`/lecturer/attendance?student_id=${student.id}`} className="text-blue-600 hover:underline">
                        Attendance
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;