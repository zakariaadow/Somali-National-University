import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call when available
        setNews([
          {
            id: 1,
            title: "University Announces New Academic Programs",
            summary: "SNU introduces 5 new programs in emerging fields including Data Science, AI, Renewable Energy, Public Health, and International Relations.",
            content: "Somali National University is proud to announce the launch of new academic programs...",
            category: "Academic",
            published_date: "2026-01-15",
            image: "🎓"
          },
          {
            id: 2,
            title: "Research Excellence Award 2026",
            summary: "Faculty members recognized for outstanding research contributions in medicine, environmental science, and engineering.",
            content: "The university celebrated its researchers with the annual Research Excellence Awards...",
            category: "Research",
            published_date: "2026-01-10",
            image: "🔬"
          },
          {
            id: 3,
            title: "New Campus Facilities Opening",
            summary: "State-of-the-art laboratories, library expansion, and student recreation center opening.",
            content: "The university is expanding its campus with new state-of-the-art facilities...",
            category: "Campus",
            published_date: "2026-01-05",
            image: "🏗️"
          },
          {
            id: 4,
            title: "Student Leadership Conference 2026",
            summary: "Annual student leadership development program with workshops and networking opportunities.",
            content: "Students from all faculties gathered for leadership training...",
            category: "Student Life",
            published_date: "2025-12-20",
            image: "🌟"
          },
          {
            id: 5,
            title: "International Partnership Signed",
            summary: "New collaboration with leading global universities for student exchange and research.",
            content: "SNU signed partnership agreements with international institutions...",
            category: "Partnerships",
            published_date: "2025-12-15",
            image: "🤝"
          },
          {
            id: 6,
            title: "Digital Learning Initiative Launch",
            summary: "University launches new digital learning platform to enhance online education.",
            content: "The university is investing in digital infrastructure to support online learning...",
            category: "Technology",
            published_date: "2025-12-10",
            image: "💻"
          }
        ]);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const categories = ['all', ...new Set(news.map(item => item.category).filter(Boolean))];
  
  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(item => item.category === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load News</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
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
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white py-16 border-b border-gray-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">University News</h1>
              <p className="text-gray-300 mt-2 text-lg">
                Stay updated with the latest news and events
              </p>
            </div>
            <div className="w-full md:w-48">
              <select
                className="w-full px-4 py-3 rounded-lg text-white bg-gray-800 border border-gray-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredNews.length === 0 ? (
            <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-gray-300 text-lg">No news found for the selected category.</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-700 hover:border-orange-500 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{item.image || '📰'}</span>
                      <span className="px-3 py-1 bg-orange-900/30 text-orange-300 text-xs font-semibold rounded-full border border-orange-700">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {item.summary || item.content?.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {new Date(item.published_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <Link 
                        to={`/news/${item.id}`} 
                        className="inline-flex items-center text-orange-400 hover:text-orange-300 font-medium group-hover:translate-x-1 transition-transform"
                      >
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
          )}
          
          {/* Results count */}
          {filteredNews.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-400">
              Showing {filteredNews.length} of {news.length} articles
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;