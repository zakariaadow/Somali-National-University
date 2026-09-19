import React from 'react';
import { Link } from 'react-router-dom';

const FacultyCard = ({ faculty }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{faculty.name}</h3>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {faculty.code}
        </span>
      </div>
      <p className="text-gray-600 text-sm mt-2">{faculty.description}</p>
      {faculty.college_name && (
        <p className="text-sm text-gray-500 mt-2">
          <span className="font-medium">College:</span> {faculty.college_name}
        </p>
      )}
      <div className="mt-4 flex space-x-2">
        <Link
          to={`/faculties/${faculty.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </Link>
        <Link
          to={`/faculties/${faculty.id}/departments`}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Departments →
        </Link>
      </div>
    </div>
  );
};

export default FacultyCard;