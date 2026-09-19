import React from 'react';
import { Link } from 'react-router-dom';

const CollegeCard = ({ college }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {college.code}
        </span>
      </div>
      <p className="text-gray-600 text-sm mt-2">{college.description}</p>
      {college.dean_name && (
        <p className="text-sm text-gray-500 mt-2">
          <span className="font-medium">Dean:</span> {college.dean_name}
        </p>
      )}
      <div className="mt-4 flex space-x-2">
        <Link
          to={`/colleges/${college.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </Link>
        <Link
          to={`/colleges/${college.id}/faculties`}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Faculties →
        </Link>
      </div>
    </div>
  );
};

export default CollegeCard;