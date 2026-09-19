import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>
        📚
      </div>
      <div className="absolute bottom-20 right-10 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>
        🎓
      </div>
      <div className="absolute top-1/3 right-20 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>
        ✨
      </div>

      {/* Main Content */}
      <div className={`relative max-w-2xl w-full text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* 404 Number with Glow Effect */}
        <div className="relative inline-block mb-6">
          <div className="text-9xl md:text-[12rem] font-extrabold text-gray-900 leading-none tracking-tight select-none">
            404
          </div>
          <div className="absolute inset-0 text-9xl md:text-[12rem] font-extrabold text-blue-500/20 leading-none tracking-tight blur-2xl select-none">
            404
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
        </div>

        {/* Icon */}
        <div className="text-6xl mb-4 animate-float">
          🔍
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have wandered off into the academic archives.
        </p>

        {/* Suggestions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">You might want to try:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">Checking the URL</span>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">Going back to previous page</span>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">Using the navigation menu</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="group inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span className="mr-2 group-hover:rotate-[-10deg] transition-transform">🏠</span>
            Go Home
          </Link>
          <Link
            to="/colleges"
            className="group inline-flex items-center justify-center px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 border border-gray-200"
          >
            <span className="mr-2 group-hover:scale-110 transition-transform">🏛️</span>
            Explore Colleges
          </Link>
        </div>

        {/* Fun Fact */}
        <div className="mt-8 text-sm text-gray-400">
          <span className="inline-block mr-2">💡</span>
          Did you know? SNU has <span className="font-semibold text-gray-600">160+</span> academic units!
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;