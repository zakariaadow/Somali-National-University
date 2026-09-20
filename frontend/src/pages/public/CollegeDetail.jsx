import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const CollegeDetail = () => {
  const { id } = useParams();
  const [college, setCollege] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollegeDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/colleges/${id}`);
        setCollege(response.data.college);
        setFaculties(response.data.faculties || []);
        setProgrammes(response.data.programmes || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching college details:', err);
        setError('Failed to load college details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading college details...</p>
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-white mb-2">College Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The college you are looking for does not exist.'}</p>
          <Link to="/colleges" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
            Back to Colleges
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
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/colleges" className="text-gray-300 hover:text-white transition">
              ← Back to Colleges
            </Link>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white">{college.name}</h1>
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm font-semibold rounded-full border border-blue-700">
                  {college.code}
                </span>
              </div>
              <p className="text-gray-300 mt-2 max-w-2xl">{college.description}</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                🎓 {programmes.length} Programmes
              </span>
              <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                📚 {faculties.length} Faculties
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* College Info */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">About {college.name}</h2>
            <p className="text-gray-300 leading-relaxed">{college.description}</p>
            {college.dean_name && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Dean</p>
                  <p className="font-medium text-white">{college.dean_name}</p>
                </div>
                {college.dean_email && (
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium text-white">{college.dean_email}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Faculties */}
          {faculties.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">📚</span>
                Faculties in {college.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faculties.map((faculty) => (
                  <Link
                    key={faculty.id}
                    to={`/faculties/${faculty.id}`}
                    className="bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-700 hover:border-blue-500"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                        {faculty.name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-semibold rounded-full border border-blue-700">
                        {faculty.code}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{faculty.description}</p>
                    <div className="mt-3 text-blue-400 group-hover:text-blue-300 text-sm font-medium">
                      View Faculty →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Programmes */}
          {programmes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🎓</span>
                Programmes Offered
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programmes.map((programme) => (
                  <div key={programme.id} className="bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition border border-gray-700 hover:border-blue-500">
                    <h3 className="font-bold text-white">{programme.name}</h3>
                    <p className="text-sm text-gray-400">{programme.department_name}</p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded-full text-xs border border-green-700">
                        {programme.duration_years} years
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400">{programme.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CollegeDetail;