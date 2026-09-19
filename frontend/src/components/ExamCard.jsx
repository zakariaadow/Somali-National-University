import React from 'react';

const ExamCard = ({ examCard }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold text-gray-900">Exam Card</h3>
        <p className="text-gray-500">{examCard.exam_card_number}</p>
      </div>

      <div className="py-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Student</span>
          <span className="font-medium">{examCard.student_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Registration</span>
          <span className="font-medium">{examCard.registration_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Semester</span>
          <span className="font-medium">{examCard.semester_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Academic Year</span>
          <span className="font-medium">{examCard.academic_year}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Generated</span>
          <span className="font-medium">
            {new Date(examCard.generated_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            examCard.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {examCard.is_approved ? 'Approved' : 'Pending'}
          </span>
        </div>
      </div>

      {examCard.is_approved && examCard.exam_card_pdf && (
        <div className="border-t pt-4 text-center">
          <button
            onClick={() => window.open(examCard.download_url, '_blank')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-150"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamCard;