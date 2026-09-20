import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const Programmes = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [programmesRes, collegesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/programmes?is_active=true`),
          axios.get(`${API_BASE_URL}/colleges?is_active=true`)
        ]);
        setProgrammes(programmesRes.data.programmes || []);
        setColleges(collegesRes.data.colleges || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load programmes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProgrammes = programmes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.department_name && p.department_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCollege = !selectedCollege || p.college_id === parseInt(selectedCollege);
    return matchesSearch && matchesCollege;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Our Programmes</h1>
              <p className="text-purple-100 mt-2 text-lg">
                <span className="font-semibold text-white">{programmes.length}</span> undergraduate programmes across all disciplines
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-10 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 shadow-lg"
                  placeholder="Search programmes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <select
                className="px-4 py-3 rounded-lg text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800"
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
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProgrammes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🎓</div>
              <p className="text-gray-500 text-lg">No programmes found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProgrammes.map((programme) => (
                <div key={programme.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-100 hover:border-purple-200 transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition">
                      {programme.name}
                    </h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {programme.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{programme.department_name}</p>
                  <p className="text-sm text-gray-400 mb-3">{programme.college_name}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {programme.duration_years} years
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{programme.duration_years === 4 ? 'Bachelor\'s' : 'Professional'}</span>
                  </div>
                  {programme.description && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">{programme.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {filteredProgrammes.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredProgrammes.length} of {programmes.length} programmes
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Programmes;