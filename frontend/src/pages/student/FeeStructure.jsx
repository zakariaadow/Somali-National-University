import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const FeeStructure = () => {
  const navigate = useNavigate();
  const [feeStructure, setFeeStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const semestersRes = await axios.get(`${API_BASE_URL}/semesters?is_active=true`, {
          withCredentials: true
        });
        setSemesters(semestersRes.data.semesters || []);
        
        const currentSemester = semestersRes.data.semesters?.find(s => s.is_current);
        if (currentSemester) {
          setSelectedSemester(currentSemester.id);
          await fetchFeeStructure(currentSemester.id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load fee structure.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchFeeStructure = async (semesterId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/student/fee-structure?semester_id=${semesterId}&academic_year_id=1`,
        { withCredentials: true }
      );
      setFeeStructure(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching fee structure:', err);
      setFeeStructure(null);
      if (err.response?.status === 404) {
        setError('Fee structure not available for this semester.');
      } else {
        setError('Failed to load fee structure.');
      }
    }
  };

  const handleSemesterChange = (e) => {
    const semesterId = e.target.value;
    setSelectedSemester(semesterId);
    if (semesterId) {
      fetchFeeStructure(semesterId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading fee structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fee Structure</h1>
          <p className="text-gray-600">View the fee structure for your programme.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Semester</label>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Semester</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {feeStructure && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{feeStructure.name}</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tuition Fee</span>
                <span className="font-medium">${feeStructure.tuition_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Registration Fee</span>
                <span className="font-medium">${feeStructure.registration_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Examination Fee</span>
                <span className="font-medium">${feeStructure.examination_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Student Card Fee</span>
                <span className="font-medium">${feeStructure.student_card_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Library Fee</span>
                <span className="font-medium">${feeStructure.library_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Sports Fee</span>
                <span className="font-medium">${feeStructure.sports_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Medical Fee</span>
                <span className="font-medium">${feeStructure.medical_fee?.toFixed(2)}</span>
              </div>
              {feeStructure.other_fees > 0 && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Other Fees</span>
                  <span className="font-medium">${feeStructure.other_fees?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-semibold text-blue-900">Total Fee</span>
                <span className="font-bold text-blue-900 text-lg">
                  ${feeStructure.total_fee?.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Currency: {feeStructure.currency || 'USD'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeStructure;