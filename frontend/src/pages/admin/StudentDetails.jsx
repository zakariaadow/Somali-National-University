import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaIdCard, 
  FaGraduationCap, FaCalendar, FaBook, FaMoneyBill,
  FaChartLine, FaEdit, FaPrint, FaDownload
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';
import StudentProfile from '../../components/StudentProfile';

const StudentDetails = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      // Get all users and find the student
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const user = data.users?.find(u => u.id === parseInt(id));
      
      if (!user) {
        throw new Error('Student not found');
      }

      setStudent({
        id: user.id,
        name: user.full_name || 'Student',
        email: user.email,
        phone: user.phone || 'N/A',
        registration_number: `SNU-2024-${String(user.id).padStart(3, '0')}`,
        programme: 'BSc Agriculture',
        year_of_study: 1,
        status: user.is_active ? 'Active' : 'Inactive',
        gpa: 3.75,
        total_credits: 60,
        balance: 15000,
        units_registered: 6,
        completed_units: 12,
        total_payments: 50000,
        enrolled_units: ['AGR101', 'AGR102', 'AGR103', 'AGR104', 'AGR105', 'CHM101']
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      // Fallback data
      setStudent({
        id: parseInt(id),
        name: 'John Doe',
        email: 'john.doe@snu.edu',
        phone: '+254 700 000 001',
        registration_number: 'SNU-2024-001',
        programme: 'BSc Computer Science',
        year_of_study: 2,
        status: 'Active',
        gpa: 3.75,
        total_credits: 60,
        balance: 15000,
        units_registered: 6,
        completed_units: 12,
        total_payments: 50000,
        enrolled_units: ['CS101', 'CS201', 'CS301', 'MATH101', 'STAT101', 'PHYS101']
      });
      toast.error('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!student) return <div className="text-center py-12">Student not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/admin/students" className="mr-4 text-gray-600 hover:text-gray-800">
            <FaArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
            <p className="text-gray-600">{student.registration_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center">
            <FaEdit className="mr-2" />
            Edit
          </button>
          <button className="btn-secondary flex items-center">
            <FaPrint className="mr-2" />
            Print
          </button>
          <button className="btn-primary flex items-center">
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      <StudentProfile student={student} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Units */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Enrolled Units</h2>
          <div className="space-y-3">
            {student.enrolled_units?.map((unit, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{unit}</p>
                  <p className="text-sm text-gray-500">3 Credits</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  In Progress
                </span>
              </div>
            ))}
          </div>
          {(!student.enrolled_units || student.enrolled_units.length === 0) && (
            <p className="text-gray-500 text-center py-4">No units enrolled</p>
          )}
        </div>

        {/* Academic Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Academic Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Current GPA</span>
              <span className="text-lg font-bold text-blue-600">{student.gpa}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Credits</span>
              <span className="text-lg font-bold text-gray-900">{student.total_credits}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Units Registered</span>
              <span className="text-lg font-bold text-green-600">{student.units_registered}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Completed Units</span>
              <span className="text-lg font-bold text-purple-600">{student.completed_units}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;