import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const Admissions = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/programmes?is_active=true`);
        setProgrammes(response.data.programmes || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching programmes:', err);
        setError('Failed to load programmes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgrammes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading programmes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Programmes</h2>
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white py-20 border-b border-gray-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Admissions</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join Somali National University and start your journey to excellence
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Application Process */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">📋</span>
              Application Process
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition border border-gray-600">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-white">Create an Account</h4>
                  <p className="text-gray-300 text-sm">Register with your email and personal details</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition border border-gray-600">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-white">Choose Your Programme</h4>
                  <p className="text-gray-300 text-sm">Select from our {programmes.length} undergraduate programmes</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition border border-gray-600">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-white">Submit Application</h4>
                  <p className="text-gray-300 text-sm">Complete the application form and submit</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition border border-gray-600">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-white">Pay Application Fee</h4>
                  <p className="text-gray-300 text-sm">Process your application fee payment</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition border border-gray-600">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">5</div>
                <div>
                  <h4 className="font-semibold text-white">Await Decision</h4>
                  <p className="text-gray-300 text-sm">Receive your admission decision</p>
                </div>
              </div>
            </div>
          </div>

          {/* Programmes List */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              Available Programmes
            </h2>
            <p className="text-gray-300 mb-6">
              We offer <span className="font-semibold text-green-400">{programmes.length}</span> undergraduate programmes across various disciplines
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {programmes.slice(0, 8).map((programme) => (
                <div key={programme.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition border border-gray-600">
                  <div>
                    <span className="font-medium text-white">{programme.name}</span>
                    <p className="text-xs text-gray-400">{programme.department_name}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs font-semibold rounded-full border border-green-700">
                    {programme.duration_years} yrs
                  </span>
                </div>
              ))}
            </div>
            {programmes.length > 8 && (
              <div className="text-center mt-4">
                <Link to="/programmes" className="text-green-400 hover:text-green-300 font-medium transition">
                  View All {programmes.length} Programmes →
                </Link>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 text-white rounded-2xl p-8 text-center border border-gray-600">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Apply?</h3>
            <p className="text-gray-300 mb-6">Start your application today</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg">
                Apply Now
              </Link>
              <Link to="/colleges" className="px-8 py-3 bg-transparent border-2 border-gray-400 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 hover:border-gray-300 hover:text-white transition">
                Explore Colleges
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admissions;