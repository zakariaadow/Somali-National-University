import { useState, useEffect } from 'react';
import { FaSearch, FaVideo, FaCalendar, FaClock, FaUsers, FaLink, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import OnlineClassCard from '../../components/OnlineClassCard';
import Loader from '../../components/Loader';

const OnlineClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/student/online-classes', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch online classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching online classes:', error);
      setClasses([
        {
          id: 1,
          title: 'Introduction to Agriculture Lecture',
          unit: 'AGR101',
          unit_name: 'Introduction to Agriculture',
          date: '2024-08-20',
          start_time: '10:00',
          end_time: '12:00',
          attendees: 25,
          status: 'Upcoming',
          meeting_link: 'https://meet.google.com/abc-defg-hij',
          lecturer: 'Dr. John Doe'
        },
        {
          id: 2,
          title: 'Crop Production Review Session',
          unit: 'AGR102',
          unit_name: 'Crop Production I',
          date: '2024-08-22',
          start_time: '14:00',
          end_time: '16:00',
          attendees: 20,
          status: 'Upcoming',
          meeting_link: 'https://meet.google.com/klm-nopq-rst',
          lecturer: 'Prof. Jane Smith'
        }
      ]);
      toast.error('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Loader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Online Classes</h1>
        <p className="text-gray-600">Join your virtual classes and review recordings</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search classes..."
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
            <option value="all">All Classes</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FaVideo className="mr-2" />
          {filteredClasses.length} classes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map((cls) => (
          <OnlineClassCard key={cls.id} class={cls} />
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaVideo className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No online classes found</p>
        </div>
      )}
    </div>
  );
};

export default OnlineClasses;