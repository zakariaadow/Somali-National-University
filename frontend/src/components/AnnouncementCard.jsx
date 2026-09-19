import React from 'react';

const AnnouncementCard = ({ announcement }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
          {announcement.priority || 'Normal'}
        </span>
      </div>
      <p className="text-gray-600 mt-2">{announcement.content}</p>
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>{announcement.announcement_type}</span>
        <span>{new Date(announcement.published_date).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default AnnouncementCard;