import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FacultyDetail = () => {
  const { id } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [college, setCollege] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacultyDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/faculties/${id}`);
        setFaculty(response.data.faculty);
        setCollege(response.data.college);
        setDepartments(response.data.departments || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching faculty details:', err);
        setError('Failed to load faculty details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading faculty details...</p>
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white mb-2">Faculty Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The faculty you are looking for does not exist.'}</p>
          <Link to="/faculties" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">
            Back to Faculties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white py-16 border-b border-gray-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/faculties" className="text-gray-300 hover:text-white transition">
              ← Back to Faculties
            </Link>
            {college && (
              <>
                <span className="text-gray-600">|</span>
                <Link to={`/colleges/${college.id}`} className="text-gray-300 hover:text-white transition">
                  {college.name}
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white">{faculty.name}</h1>
                <span className="px-3 py-1 bg-green-900/30 text-green-300 text-sm font-semibold rounded-full border border-green-700">
                  {faculty.code}
                </span>
              </div>
              <p className="text-gray-300 mt-2 max-w-2xl">{faculty.description}</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                🏛️ {college?.name || 'N/A'}
              </span>
              <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                📁 {departments.length} Departments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Faculty Info */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">About {faculty.name}</h2>
            <p className="text-gray-300 leading-relaxed">{faculty.description}</p>
            {faculty.dean_name && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Dean</p>
                  <p className="font-medium text-white">{faculty.dean_name}</p>
                </div>
                {faculty.dean_email && (
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium text-white">{faculty.dean_email}</p>
                  </div>
                )}
              </div>
            )}
            {college && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">Part of</p>
                <Link to={`/colleges/${college.id}`} className="font-medium text-green-400 hover:text-green-300">
                  {college.name} →
                </Link>
              </div>
            )}
          </div>

          {/* Departments */}
          {departments.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">📁</span>
                Departments in {faculty.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Link
                    key={dept.id}
                    to={`/departments/${dept.id}`}
                    className="bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-700 hover:border-green-500"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition">
                        {dept.name}
                      </h3>
                      <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs font-semibold rounded-full border border-green-700">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{dept.description}</p>
                    <div className="mt-3 text-green-400 group-hover:text-green-300 text-sm font-medium">
                      View Department →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FacultyDetail;