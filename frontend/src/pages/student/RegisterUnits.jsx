import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const RegisterUnits = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [registeredUnits, setRegisteredUnits] = useState(0);
  const [hasRegistration, setHasRegistration] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch semesters
        const semestersRes = await axios.get(`${API_BASE_URL}/semesters?is_active=true`, {
          withCredentials: true
        });
        setSemesters(semestersRes.data.semesters || []);
        
        // Get current semester
        const currentSemester = semestersRes.data.semesters?.find(s => s.is_current);
        if (currentSemester) {
          setSelectedSemester(currentSemester.id);
          
          // Check if student has registered for this semester
          try {
            const registrationsRes = await axios.get(`${API_BASE_URL}/student/registrations`, {
              withCredentials: true
            });
            const hasReg = registrationsRes.data.registrations?.some(
              reg => reg.semester_id === currentSemester.id
            );
            setHasRegistration(hasReg);
          } catch (regErr) {
            console.log('Could not fetch registrations');
          }
          
          // Fetch available units for this semester
          await fetchAvailableUnits(currentSemester.id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      }
    };

    fetchData();
  }, [navigate]);

  const fetchAvailableUnits = async (semesterId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student/available-units?semester_id=${semesterId}`, {
        withCredentials: true
      });
      setAvailableUnits(response.data.units || []);
      setRegisteredUnits(response.data.registered_count || 0);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError(err.response?.data?.error || 'Failed to load available units.');
      setAvailableUnits([]);
    }
  };

  const handleSemesterChange = async (e) => {
    const semesterId = e.target.value;
    setSelectedSemester(semesterId);
    if (semesterId) {
      // Check registration status
      try {
        const registrationsRes = await axios.get(`${API_BASE_URL}/student/registrations`, {
          withCredentials: true
        });
        const hasReg = registrationsRes.data.registrations?.some(
          reg => reg.semester_id === parseInt(semesterId)
        );
        setHasRegistration(hasReg);
      } catch (regErr) {
        console.log('Could not fetch registrations');
      }
      
      await fetchAvailableUnits(semesterId);
    }
    setSelectedUnits([]);
  };

  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId) 
        : [...prev, unitId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUnits.length === 0) {
      setError('Please select at least one unit.');
      return;
    }

    if (!hasRegistration) {
      setError('Please register for the semester first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/student/register-units`,
        {
          semester_id: parseInt(selectedSemester),
          academic_year_id: 1, // You might want to get this from the semester
          unit_ids: selectedUnits
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        setSuccess(response.data.message);
        await fetchAvailableUnits(selectedSemester);
        setSelectedUnits([]);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error registering units:', err);
      setError(err.response?.data?.error || 'Failed to register units.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register for Units</h1>
              <p className="text-gray-600">Select the units you want to register for this semester.</p>
            </div>
            {!hasRegistration && selectedSemester && (
              <Link 
                to="/student/register-semester" 
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition"
              >
                Register Semester First
              </Link>
            )}
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

        {!hasRegistration && selectedSemester && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
            <p className="font-medium">⚠️ You need to register for this semester first.</p>
            <p className="text-sm mt-1">Please go to the semester registration page to register for the semester before selecting units.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Select Semester</label>
              <select
                value={selectedSemester}
                onChange={handleSemesterChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name} - {semester.academic_year_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSemester && (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Available Units: {availableUnits.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Already Registered: {registeredUnits}
                  </p>
                  {hasRegistration ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Semester Registered
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      ⚠️ Not Registered
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {availableUnits.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <p>No units available for registration.</p>
                      <p className="text-sm">You may have already registered for all units.</p>
                    </div>
                  ) : (
                    availableUnits.map((unit) => (
                      <label
                        key={unit.id}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          selectedUnits.includes(unit.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                          className="mr-2"
                          disabled={!hasRegistration}
                        />
                        <div className="inline">
                          <span className="font-medium">{unit.unit_code}</span>
                          <p className="text-sm text-gray-600">{unit.unit_name}</p>
                          <p className="text-xs text-gray-400">{unit.credits} credits</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || availableUnits.length === 0 || !hasRegistration}
                  className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : `Register ${selectedUnits.length} Unit${selectedUnits.length !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="text-center space-y-2">
          <div>
            <Link to="/student/register-semester" className="text-blue-600 hover:underline">
              Register for Semester →
            </Link>
          </div>
          <div>
            <Link to="/student/my-units" className="text-blue-600 hover:underline">
              View My Units →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUnits;