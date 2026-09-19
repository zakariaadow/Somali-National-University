import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Faculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [facultiesRes, collegesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/faculties?is_active=true`),
          axios.get(`${API_BASE_URL}/colleges?is_active=true`)
        ]);
        setFaculties(facultiesRes.data.faculties || []);
        setColleges(collegesRes.data.colleges || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load faculties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFaculties = faculties.filter(faculty => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faculty.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (faculty.description && faculty.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCollege = !selectedCollege || faculty.college_id === parseInt(selectedCollege);
    return matchesSearch && matchesCollege;
  });

  const groupedFaculties = filteredFaculties.reduce((acc, faculty) => {
    const collegeName = faculty.college_name || 'Unknown College';
    if (!acc[collegeName]) {
      acc[collegeName] = [];
    }
    acc[collegeName].push(faculty);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading faculties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Faculties</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section with Image */}
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white py-16 border-b border-gray-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-green-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white">Our Faculties</h1>
              <p className="text-gray-300 mt-2 text-lg">
                <span className="font-semibold text-green-400">{faculties.length}</span> faculties across{' '}
                <span className="font-semibold text-green-400">{colleges.length}</span> colleges
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <span className="px-3 py-1 bg-green-900/30 text-green-300 text-sm rounded-full border border-green-700">
                  🎓 Academic Excellence
                </span>
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-full border border-blue-700">
                  🔬 Research Innovation
                </span>
                <span className="px-3 py-1 bg-purple-900/30 text-purple-300 text-sm rounded-full border border-purple-700">
                  🌍 Global Impact
                </span>
              </div>
            </div>
            
            {/* Rounded Image */}
            <div className="flex-shrink-0">
              <img 
                src="/WhatsApp Image 2026-07-18 at 10.18.04.jpeg" 
                alt="Somali National University" 
                className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-4 border-green-500 shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full px-4 py-3 pl-10 rounded-lg text-white bg-gray-800 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg"
                placeholder="Search faculties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <select
              className="px-4 py-3 rounded-lg text-white bg-gray-800 border border-gray-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
            >
              <option value="">All Colleges</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Faculties List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.keys(groupedFaculties).length === 0 ? (
            <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-300 text-lg">No faculties found matching your criteria.</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            Object.entries(groupedFaculties).map(([collegeName, facultiesList]) => (
              <div key={collegeName} className="mb-10 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {collegeName}
                  </h2>
                  <span className="px-3 py-1 bg-green-900/30 text-green-300 text-sm font-semibold rounded-full border border-green-700">
                    {facultiesList.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facultiesList.map((faculty) => (
                    <div key={faculty.id} className="bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-700 hover:border-green-500 transform hover:-translate-y-1">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition line-clamp-2">
                            {faculty.name}
                          </h3>
                          <span className="px-3 py-1 bg-green-900/30 text-green-300 text-xs font-semibold rounded-full border border-green-700 whitespace-nowrap ml-2">
                            {faculty.code}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{faculty.description}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                          <span className="text-base">🏛️</span>
                          <span className="text-green-400">{faculty.college_name}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full border border-purple-700">
                            📁 Departments
                          </span>
                          <span className="px-2 py-1 bg-orange-900/30 text-orange-300 text-xs rounded-full border border-orange-700">
                            🎓 Programmes
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-3">
                          <Link
                            to={`/faculties/${faculty.id}`}
                            className="inline-flex items-center text-green-400 hover:text-green-300 text-sm font-medium group-hover:translate-x-1 transition-transform"
                          >
                            View Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                          <Link
                            to={`/faculties/${faculty.id}/departments`}
                            className="text-gray-400 hover:text-gray-300 text-sm font-medium"
                          >
                            Departments →
                          </Link>
                        </div>
                      </div>
                      <div className="bg-gray-900/50 px-6 py-3 flex justify-between items-center text-xs text-gray-400 border-t border-gray-700">
                        <span>Established: {new Date(faculty.created_at).getFullYear()}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* Results count */}
          {filteredFaculties.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-400">
              Showing {filteredFaculties.length} of {faculties.length} faculties
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Faculties;