import React from 'react';

const OnlineClassCard = ({ classItem }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(classItem.status)}`}>
          {classItem.status || 'scheduled'}
        </span>
      </div>
      <p className="text-gray-600 text-sm mt-2">{classItem.description}</p>
      <div className="mt-4 space-y-1 text-sm">
        <p className="text-gray-500">
          <span className="font-medium">Date:</span> {new Date(classItem.class_date).toLocaleString()}
        </p>
        <p className="text-gray-500">
          <span className="font-medium">Duration:</span> {classItem.duration} minutes
        </p>
        {classItem.meeting_link && (
          <a
            href={classItem.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Join Meeting →
          </a>
        )}
      </div>
    </div>
  );
};

export default OnlineClassCard;