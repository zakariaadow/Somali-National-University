import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white py-20 border-b border-gray-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">About Somali National University</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Excellence in Higher Education since 1970
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mission */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-700">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed">
                  Somali National University is committed to providing quality higher education, 
                  fostering research and innovation, and producing graduates who can contribute 
                  to the development of Somalia and the global community.
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-700">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Our Vision</h2>
                <p className="text-gray-300 leading-relaxed">
                  To be the leading center of academic excellence in the Horn of Africa, 
                  recognized globally for our contributions to knowledge, research, and 
                  community development.
                </p>
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-700">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <span className="text-2xl">📚</span>
                    <div>
                      <h4 className="font-semibold text-white">Academic Excellence</h4>
                      <p className="text-sm text-gray-400">Commitment to the highest standards of education</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <span className="text-2xl">🔬</span>
                    <div>
                      <h4 className="font-semibold text-white">Research Innovation</h4>
                      <p className="text-sm text-gray-400">Advancing knowledge through research</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <h4 className="font-semibold text-white">Global Citizenship</h4>
                      <p className="text-sm text-gray-400">Preparing students for a connected world</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <h4 className="font-semibold text-white">Community Engagement</h4>
                      <p className="text-sm text-gray-400">Serving our communities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Quick Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/colleges" className="bg-gray-700 rounded-xl p-4 text-center hover:shadow-lg hover:bg-gray-600 transition-all duration-300 border border-gray-600">
                <span className="text-3xl block mb-2">🏛️</span>
                <span className="text-sm font-medium text-gray-200">Colleges</span>
              </Link>
              <Link to="/faculties" className="bg-gray-700 rounded-xl p-4 text-center hover:shadow-lg hover:bg-gray-600 transition-all duration-300 border border-gray-600">
                <span className="text-3xl block mb-2">📚</span>
                <span className="text-sm font-medium text-gray-200">Faculties</span>
              </Link>
              <Link to="/admissions" className="bg-gray-700 rounded-xl p-4 text-center hover:shadow-lg hover:bg-gray-600 transition-all duration-300 border border-gray-600">
                <span className="text-3xl block mb-2">📝</span>
                <span className="text-sm font-medium text-gray-200">Admissions</span>
              </Link>
              <Link to="/contact" className="bg-gray-700 rounded-xl p-4 text-center hover:shadow-lg hover:bg-gray-600 transition-all duration-300 border border-gray-600">
                <span className="text-3xl block mb-2">📧</span>
                <span className="text-sm font-medium text-gray-200">Contact</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;