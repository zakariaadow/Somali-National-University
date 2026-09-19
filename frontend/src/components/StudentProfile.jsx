import React from 'react';

const StudentProfile = ({ student, user }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-gray-600">{student?.registration_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="font-medium">{user?.phone || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Programme</p>
          <p className="font-medium">{student?.programme_name || 'Not set'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Year of Study</p>
          <p className="font-medium">{student?.year_of_study || 1}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Admission Date</p>
          <p className="font-medium">
            {student?.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            student?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {student?.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;