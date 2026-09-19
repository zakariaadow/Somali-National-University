import React from 'react';

const StudentCardComponent = ({ studentCard }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center border-b pb-4">
        <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto overflow-hidden">
          {studentCard.photo ? (
            <img src={studentCard.photo} alt="Student" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-blue-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">SNU</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-2">
          {studentCard.student_name}
        </h3>
        <p className="text-gray-500">{studentCard.registration_number}</p>
      </div>

      <div className="py-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Card Number</span>
          <span className="font-medium">{studentCard.card_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Programme</span>
          <span className="font-medium">{studentCard.programme_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Issue Date</span>
          <span className="font-medium">
            {studentCard.issue_date ? new Date(studentCard.issue_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expiry Date</span>
          <span className="font-medium">
            {studentCard.expiry_date ? new Date(studentCard.expiry_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(studentCard.status)}`}>
            {studentCard.status?.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentCardComponent;