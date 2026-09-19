import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const Home = () => {
  const [stats, setStats] = useState({
    colleges: 0,
    faculties: 0,
    departments: 0,
    programmes: 0,
    units: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredNews, setFeaturedNews] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [collegesRes, facultiesRes, departmentsRes, programmesRes, unitsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/colleges?is_active=true`),
          axios.get(`${API_BASE_URL}/faculties?is_active=true`),
          axios.get(`${API_BASE_URL}/departments?is_active=true`),
          axios.get(`${API_BASE_URL}/programmes?is_active=true`),
          axios.get(`${API_BASE_URL}/units?is_active=true`)
        ]);

        setStats({
          colleges: collegesRes.data.total || 0,
          faculties: facultiesRes.data.total || 0,
          departments: departmentsRes.data.total || 0,
          programmes: programmesRes.data.total || 0,
          units: unitsRes.data.total || 0
        });

        setFeaturedNews([
          {
            id: 1,
            title: "University Announces New Academic Programs",
            summary: "SNU introduces 5 new programs in emerging fields",
            category: "Academic",
            date: "2026-01-15",
            icon: "🎓"
          },
          {
            id: 2,
            title: "Research Excellence Award 2026",
            summary: "Faculty members recognized for outstanding research",
            category: "Research",
            date: "2026-01-10",
            icon: "🔬"
          },
          {
            id: 3,
            title: "New Campus Facilities Opening",
            summary: "State-of-the-art laboratories and library expansion",
            category: "Campus",
            date: "2026-01-05",
            icon: "🏗️"
          }
        ]);

        setError(null);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading university data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section with Image Background */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('/WhatsApp%20Image%202026-07-18%20at%2010.18.04.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Excellence in Higher Education
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 drop-shadow-lg">
                Welcome to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  Somali National University
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-xl drop-shadow-md">
                The premier institution of higher learning in Somalia. Explore our academic programs, 
                research opportunities, and vibrant campus life.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transform hover:-translate-y-1 hover:scale-105"
                >
                  Apply Now
                </Link>
                <Link
                  to="/admissions"
                  className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">{stats.colleges}</div>
                <div className="text-sm text-gray-300">Colleges</div>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">{stats.faculties}</div>
                <div className="text-sm text-gray-300">Faculties</div>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">{stats.departments}</div>
                <div className="text-sm text-gray-300">Departments</div>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">{stats.programmes}</div>
                <div className="text-sm text-gray-300">Programmes</div>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/colleges" className="group bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-600 hover:border-blue-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/20">
                🏛️
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">Our Colleges</h3>
              <p className="text-sm text-gray-400 mt-1">Explore our {stats.colleges} colleges</p>
              <div className="mt-4 w-12 h-1 bg-blue-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
            </Link>

            <Link to="/faculties" className="group bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-600 hover:border-green-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-600/20">
                📚
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition">Faculties</h3>
              <p className="text-sm text-gray-400 mt-1">Discover our {stats.faculties} faculties</p>
              <div className="mt-4 w-12 h-1 bg-green-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
            </Link>

            <Link to="/programmes" className="group bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-600 hover:border-purple-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/20">
                🎓
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition">Programmes</h3>
              <p className="text-sm text-gray-400 mt-1">{stats.programmes} programmes available</p>
              <div className="mt-4 w-12 h-1 bg-purple-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
            </Link>

            <Link to="/news" className="group bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-600 hover:border-orange-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-600/20">
                📰
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition">Latest News</h3>
              <p className="text-sm text-gray-400 mt-1">Stay updated with SNU</p>
              <div className="mt-4 w-12 h-1 bg-orange-500 rounded-full group-hover:w-20 transition-all duration-300"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Statistics</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-2">
              University at a Glance
            </h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">Discover the numbers behind our academic excellence</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="group bg-gray-800 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-700 hover:border-blue-500">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">{stats.colleges}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">Colleges</div>
              <div className="mt-3 text-xs text-gray-500">Academic Divisions</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mx-auto group-hover:w-24 transition-all duration-300"></div>
            </div>
            <div className="group bg-gray-800 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-700 hover:border-green-500">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">{stats.faculties}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">Faculties</div>
              <div className="mt-3 text-xs text-gray-500">Specialized Schools</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-green-500 to-green-300 rounded-full mx-auto group-hover:w-24 transition-all duration-300"></div>
            </div>
            <div className="group bg-gray-800 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-700 hover:border-purple-500">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-purple-300 bg-clip-text text-transparent">{stats.departments}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">Departments</div>
              <div className="mt-3 text-xs text-gray-500">Academic Units</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full mx-auto group-hover:w-24 transition-all duration-300"></div>
            </div>
            <div className="group bg-gray-800 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-700 hover:border-orange-500">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">{stats.programmes}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">Programmes</div>
              <div className="mt-3 text-xs text-gray-500">Degree Programs</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mx-auto group-hover:w-24 transition-all duration-300"></div>
            </div>
            <div className="group bg-gray-800 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-700 hover:border-red-500">
              <div className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">{stats.units || 160}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">Units</div>
              <div className="mt-3 text-xs text-gray-500">Course Offerings</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-red-500 to-red-300 rounded-full mx-auto group-hover:w-24 transition-all duration-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured News Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <span className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Updates</span>
              <h2 className="text-4xl font-bold text-white mt-1">Latest News</h2>
              <p className="text-gray-400 mt-2">Stay informed with university updates</p>
            </div>
            <Link to="/news" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg shadow-orange-600/25 hover:shadow-xl hover:shadow-orange-600/30 transform hover:-translate-y-1">
              View All
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredNews.map((news) => (
              <div key={news.id} className="group bg-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-600 hover:border-orange-500 transform hover:-translate-y-2">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{news.icon}</span>
                    <span className="px-4 py-1.5 bg-gradient-to-r from-orange-900/50 to-orange-800/50 text-orange-300 text-xs font-semibold rounded-full border border-orange-700">
                      {news.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{news.summary}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <Link to={`/news/${news.id}`} className="inline-flex items-center text-orange-400 hover:text-orange-300 font-medium group-hover:translate-x-1 transition-transform">
                      Read More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Image Background */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('/WhatsApp%20Image%202026-07-18%20at%2010.18.04.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-6">
            🌟 Join Our Community
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Start your journey at Somali National University today and become part of a legacy of excellence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transform hover:-translate-y-1 hover:scale-105"
            >
              Apply Now
            </Link>
            <Link
              to="/colleges"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;