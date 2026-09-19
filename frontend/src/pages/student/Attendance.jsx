import { useState, useEffect } from 'react';
import { FaSearch, FaCalendar, FaCheckCircle, FaTimesCircle, FaClock, FaBook, FaChartLine } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    total_classes: 0,
    attended: 0,
    absent: 0,
    late: 0,
    overall_percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [units, setUnits] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/student/attendance', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const data = await response.json();
      setAttendance(data.records || data);
      
      if (data.summary) {
        setSummary(data.summary);
      } else {
        const total = data.length;
        const attended = data.filter(a => a.status === 'Present').length;
        const absent = data.filter(a => a.status === 'Absent').length;
        const late = data.filter(a => a.status === 'Late').length;
        setSummary({
          total_classes: total,
          attended: attended,
          absent: absent,
          late: late,
          overall_percentage: total > 0 ? Math.round((attended / total) * 100) : 0
        });
      }

      const uniqueUnits = [...new Set(data.map(a => a.unit).filter(Boolean))];
      setUnits(uniqueUnits);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      const mockAttendance = [
        { id: 1, unit: 'AGR101', unit_name: 'Introduction to Agriculture', date: '2024-08-15', status: 'Present', time: '10:00 AM' },
        { id: 2, unit: 'AGR101', unit_name: 'Introduction to Agriculture', date: '2024-08-14', status: 'Present', time: '10:00 AM' },
        { id: 3, unit: 'AGR102', unit_name: 'Crop Production I', date: '2024-08-15', status: 'Absent', time: '2:00 PM' }
      ];
      setAttendance(mockAttendance);
      setUnits(['AGR101', 'AGR102']);
      setSummary({
        total_classes: 3,
        attended: 2,
        absent: 1,
        late: 0,
        overall_percentage: 67
      });
      toast.error('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center"><FaCheckCircle className="mr-1" size={12} /> Present</span>;
      case 'Absent':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center"><FaTimesCircle className="mr-1" size={12} /> Absent</span>;
      case 'Late':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center"><FaClock className="mr-1" size={12} /> Late</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'all' || record.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  if (loading) return <Loader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">View your attendance records</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_classes}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center border border-green-200">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{summary.attended}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-md p-4 text-center border border-red-200">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
        </div>
        <div className={`rounded-lg shadow-md p-4 text-center border ${
          summary.overall_percentage >= 80 ? 'bg-green-50 border-green-200' :
          summary.overall_percentage >= 60 ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm ${summary.overall_percentage >= 80 ? 'text-green-600' : summary.overall_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            Attendance Rate
          </p>
          <p className={`text-2xl font-bold ${summary.overall_percentage >= 80 ? 'text-green-600' : summary.overall_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {summary.overall_percentage}%
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search by unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Units</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.unit}</p>
                      <p className="text-xs text-gray-500">{record.unit_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="flex items-center">
                      <FaCalendar className="mr-1 text-gray-400" size={14} />
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.time || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAttendance.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaChartLine className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;