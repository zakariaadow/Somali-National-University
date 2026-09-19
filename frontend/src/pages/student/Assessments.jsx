import { useState, useEffect } from 'react';
import { FaSearch, FaCalendar, FaClock, FaCheckCircle, FaTimesCircle, FaClock as FaClockIcon, FaBook } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/student/assessments', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }

      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setAssessments([
        { 
          id: 1, 
          title: 'Quiz 1: Agriculture Basics', 
          unit: 'AGR101', 
          unit_name: 'Introduction to Agriculture',
          type: 'Quiz',
          due_date: '2024-08-20',
          max_score: 20,
          score: 18,
          status: 'Completed',
          duration: 30
        },
        { 
          id: 2, 
          title: 'Assignment 1: Crop Production', 
          unit: 'AGR102',
          unit_name: 'Crop Production I',
          type: 'Assignment',
          due_date: '2024-08-25',
          max_score: 50,
          score: null,
          status: 'Pending',
          duration: 120
        }
      ]);
      toast.error('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center"><FaCheckCircle className="mr-1" size={12} /> Completed</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center"><FaClockIcon className="mr-1" size={12} /> Pending</span>;
      case 'Upcoming':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center"><FaCalendar className="mr-1" size={12} /> Upcoming</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const filteredAssessments = assessments.filter(ass => {
    const matchesSearch = ass.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ass.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ass.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Loader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
        <p className="text-gray-600">View all your assessments and grades</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAssessments.map((assessment) => (
          <div key={assessment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                <p className="text-sm text-blue-600 flex items-center">
                  <FaBook className="mr-1" size={14} />
                  {assessment.unit} - {assessment.unit_name}
                </p>
                <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {assessment.type}
                </span>
              </div>
              {getStatusBadge(assessment.status)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(assessment.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-700 flex items-center justify-center">
                  <FaClock className="mr-1" size={12} />
                  {assessment.duration} min
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Max Score</p>
                <p className="text-sm font-medium text-gray-700">{assessment.max_score}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Your Score</p>
                <p className={`text-sm font-bold ${assessment.score !== null ? 'text-blue-600' : 'text-gray-400'}`}>
                  {assessment.score !== null ? assessment.score : 'Not graded'}
                </p>
              </div>
            </div>

            {assessment.status === 'Pending' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full btn-primary py-2">
                  Start Assessment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaCalendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No assessments found</p>
        </div>
      )}
    </div>
  );
};

export default Assessments;