import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        // In production, fetch from API
        // const response = await axios.get(`${API_BASE_URL}/news/${id}`);
        // setNews(response.data);
        
        // Mock data for demonstration
        const mockNews = {
          1: {
            id: 1,
            title: "University Announces New Academic Programs",
            content: `
              <p>Somali National University is proud to announce the launch of new academic programs in emerging fields for the upcoming academic year.</p>
              
              <h3>New Programs</h3>
              <ul>
                <li><strong>Bachelor of Science in Data Science</strong> - A comprehensive program covering machine learning, big data analytics, and artificial intelligence.</li>
                <li><strong>Bachelor of Science in Artificial Intelligence</strong> - Focused on AI technologies, neural networks, and intelligent systems.</li>
                <li><strong>Bachelor of Science in Renewable Energy</strong> - Addressing the growing need for sustainable energy solutions.</li>
                <li><strong>Bachelor of Public Health</strong> - Preparing students for careers in public health policy and practice.</li>
                <li><strong>Bachelor of Arts in International Relations</strong> - Understanding global politics and diplomacy.</li>
              </ul>
              
              <h3>Application Process</h3>
              <p>Applications for these new programs are now open. Prospective students are encouraged to apply early to secure their place. The university will be hosting virtual information sessions for each program.</p>
              
              <p><strong>Application Deadline:</strong> March 31, 2026</p>
              <p><strong>Program Start:</strong> September 2026</p>
            `,
            summary: "SNU introduces 5 new programs in emerging fields including Data Science, AI, Renewable Energy, Public Health, and International Relations.",
            category: "Academic",
            published_date: "2026-01-15",
            image: "🎓",
            author: "Academic Affairs Office",
            tags: ["Academics", "New Programs", "Admissions"]
          },
          2: {
            id: 2,
            title: "Research Excellence Award 2026",
            content: `
              <p>The university celebrated its researchers with the annual Research Excellence Awards, recognizing outstanding contributions in various fields.</p>
              
              <h3>2026 Award Winners</h3>
              <ul>
                <li><strong>Dr. Ahmed Hassan</strong> - Medical Research Excellence Award for groundbreaking work in tropical diseases.</li>
                <li><strong>Prof. Fatima Ali</strong> - Environmental Science Award for research on climate change adaptation.</li>
                <li><strong>Dr. Mohamed Omar</strong> - Engineering Innovation Award for sustainable energy solutions.</li>
              </ul>
              
              <h3>Research Impact</h3>
              <p>This year's research has led to several publications in high-impact journals and has attracted international attention to our university's research capabilities.</p>
            `,
            summary: "Faculty members recognized for outstanding research contributions in medicine, environmental science, and engineering.",
            category: "Research",
            published_date: "2026-01-10",
            image: "🔬",
            author: "Research Office",
            tags: ["Research", "Awards", "Faculty"]
          },
          3: {
            id: 3,
            title: "New Campus Facilities Opening",
            content: `
              <p>The university is expanding its campus with new state-of-the-art facilities to enhance the learning experience for students.</p>
              
              <h3>New Facilities</h3>
              <ul>
                <li><strong>Modern Library</strong> - A 24/7 facility with digital resources, study spaces, and research support.</li>
                <li><strong>Research Laboratories</strong> - Equipped with cutting-edge technology for scientific research.</li>
                <li><strong>Student Recreation Center</strong> - Featuring sports facilities, gym, and wellness areas.</li>
                <li><strong>Innovation Hub</strong> - A space for student entrepreneurship and innovation.</li>
              </ul>
              
              <h3>Opening Dates</h3>
              <p>The facilities will be opened in phases starting from February 2026. Students and staff are invited to the opening ceremonies.</p>
            `,
            summary: "State-of-the-art laboratories, library expansion, and student recreation center opening.",
            category: "Campus",
            published_date: "2026-01-05",
            image: "🏗️",
            author: "Facilities Management",
            tags: ["Campus", "Infrastructure", "Student Life"]
          },
          4: {
            id: 4,
            title: "Student Leadership Conference 2026",
            content: `
              <p>Students from all faculties gathered for leadership training, workshops on entrepreneurship, and community engagement initiatives.</p>
              
              <h3>Conference Highlights</h3>
              <ul>
                <li>Leadership skills development workshops</li>
                <li>Entrepreneurship and innovation sessions</li>
                <li>Community service project planning</li>
                <li>Networking opportunities with alumni</li>
              </ul>
              
              <h3>Keynote Speakers</h3>
              <p>Industry leaders and successful alumni shared their experiences and insights with students.</p>
            `,
            summary: "Annual student leadership development program with workshops and networking opportunities.",
            category: "Student Life",
            published_date: "2025-12-20",
            image: "🌟",
            author: "Student Affairs",
            tags: ["Students", "Leadership", "Conference"]
          },
          5: {
            id: 5,
            title: "International Partnership Signed",
            content: `
              <p>SNU signed partnership agreements with international institutions for student exchange programs and joint research initiatives.</p>
              
              <h3>Partner Institutions</h3>
              <ul>
                <li>University of Nairobi, Kenya</li>
                <li>University of London, UK</li>
                <li>University of Toronto, Canada</li>
                <li>University of Cape Town, South Africa</li>
              </ul>
              
              <h3>Benefits for Students</h3>
              <ul>
                <li>Student exchange opportunities</li>
                <li>Joint research projects</li>
                <li>International internships</li>
                <li>Cross-cultural learning experiences</li>
              </ul>
            `,
            summary: "New collaboration with leading global universities for student exchange and research.",
            category: "Partnerships",
            published_date: "2025-12-15",
            image: "🤝",
            author: "International Office",
            tags: ["Partnerships", "International", "Exchange"]
          }
        };

        // Get the news item or use a default
        const newsItem = mockNews[id] || mockNews[1];
        setNews(newsItem);
        
        // Get related news (excluding current)
        const related = Object.values(mockNews).filter(item => item.id !== parseInt(id));
        setRelatedNews(related.slice(0, 3));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching news details:', err);
        setError('Failed to load news details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id]);

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

  if (error || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-white mb-2">News Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The news article you are looking for does not exist.'}</p>
          <Link to="/news" className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition">
            Back to News
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
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/news" className="inline-flex items-center text-gray-300 hover:text-white transition mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to News
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{news.image || '📰'}</span>
            <span className="px-3 py-1 bg-orange-900/30 text-orange-300 text-sm font-semibold rounded-full border border-orange-700">
              {news.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {news.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-300">
            <span>{news.author || 'SNU News'}</span>
            <span>•</span>
            <span>{new Date(news.published_date).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
            {/* Summary */}
            <div className="p-6 bg-blue-900/30 border-b border-blue-700">
              <p className="text-lg text-blue-300 font-medium">
                {news.summary}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="px-6 md:px-8 pb-6">
                <div className="flex flex-wrap gap-2">
                  {news.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="px-6 md:px-8 pb-6 border-t border-gray-700 pt-6">
              <p className="text-sm text-gray-400 mb-3">Share this article:</p>
              <div className="flex gap-3">
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button className="p-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.803-11.828c0-.21-.005-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Related News */}
          {relatedNews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">Related News</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-700 hover:border-orange-500"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{item.image || '📰'}</span>
                      <span className="px-2 py-1 bg-orange-900/30 text-orange-300 text-xs font-semibold rounded-full border border-orange-700">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-white group-hover:text-orange-400 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{item.summary}</p>
                    <div className="mt-3 text-sm text-gray-500">
                      {new Date(item.published_date).toLocaleDateString()}
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

export default NewsDetail;