import React from 'react';

const LecturerCard = ({ lecturer }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600">
            {lecturer.user?.first_name?.[0]}{lecturer.user?.last_name?.[0]}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {lecturer.user?.first_name} {lecturer.user?.last_name}
          </h3>
          <p className="text-gray-600 text-sm">{lecturer.specialization}</p>
          <p className="text-gray-500 text-sm">{lecturer.qualification}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium">Staff Number:</span> {lecturer.staff_number}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-medium">Department:</span> {lecturer.department_name}
        </p>
      </div>
    </div>
  );
};

export default LecturerCard;