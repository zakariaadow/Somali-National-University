import React from 'react';
import { Link } from 'react-router-dom';

const Hero = ({ title, subtitle, backgroundImage, ctaText, ctaLink }) => {
  return (
    <div className={`relative bg-gradient-to-r from-blue-600 to-blue-800 text-white ${backgroundImage ? '' : 'py-20'}`}>
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        ></div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {title || 'Welcome to Somali National University'}
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
          {subtitle || 'Empowering education through comprehensive student learning and management.'}
        </p>
        {ctaText && ctaLink && (
          <Link
            to={ctaLink}
            className="inline-block px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition duration-150"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Hero;