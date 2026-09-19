import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ============ LAYOUTS ============
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import LecturerLayout from './layouts/LecturerLayout';
import FinanceLayout from './layouts/FinanceLayout';
import FacultyOfficerLayout from './layouts/FacultyOfficerLayout';
import CollegeOfficerLayout from './layouts/CollegeOfficerLayout';

// ============ PUBLIC PAGES ============
import Home from './pages/public/Home';
import About from './pages/public/About';
import Colleges from './pages/public/Colleges';
import CollegeDetail from './pages/public/CollegeDetail';
import Faculties from './pages/public/Faculties';
import FacultyDetail from './pages/public/FacultyDetail';
import DepartmentDetail from './pages/public/DepartmentDetail';
import Programmes from './pages/public/Programmes';
import News from './pages/public/News';
import NewsDetail from './pages/public/NewsDetail';
import Contact from './pages/public/Contact';
import Admissions from './pages/public/Admissions';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

// ============ STUDENT PAGES ============
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentMyUnits from './pages/student/MyUnits';
import StudentPayments from './pages/student/Payments';
import StudentResults from './pages/student/Results';
import StudentExamCard from './pages/student/ExamCard';
import StudentCard from './pages/student/StudentCard';
import RegisterSemester from './pages/student/RegisterSemester';
import RegisterUnits from './pages/student/RegisterUnits';
import FeeStructure from './pages/student/FeeStructure';
import StudentAnnouncements from './pages/student/Announcements';
import StudentAssessments from './pages/student/Assessments';
import StudentAttendance from './pages/student/Attendance';
import StudentOnlineClasses from './pages/student/OnlineClasses';
import StudentReceipts from './pages/student/Receipts';
import StudentSettings from './pages/student/Settings';

// ============ ADMIN PAGES ============
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminStudents from './pages/admin/Students';
import AdminStudentDetails from './pages/admin/StudentDetails';
import AdminLecturers from './pages/admin/Lecturers';
import AdminColleges from './pages/admin/Colleges';
import AdminFaculties from './pages/admin/Faculties';
import AdminDepartments from './pages/admin/Departments';
import AdminProgrammes from './pages/admin/Programmes';
import AdminUnits from './pages/admin/Units';
import AdminSemesters from './pages/admin/Semesters';
import AdminAcademicYears from './pages/admin/AcademicYears';
import AdminFeeStructures from './pages/admin/FeeStructures';
import AdminPayments from './pages/admin/Payments';
import AdminResults from './pages/admin/Results';
import AdminReports from './pages/admin/Reports';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminOnlineClasses from './pages/admin/OnlineClasses';
import AdminSettings from './pages/admin/Settings';
import AdminFinanceStaff from './pages/admin/FinanceStaff';
import AdminFacultyOfficers from './pages/admin/FacultyOfficers';
import AdminCollegeOfficers from './pages/admin/CollegeOfficers';

// ============ LECTURER PAGES ============
import LecturerDashboard from './pages/lecturer/Dashboard';
import LecturerMyUnits from './pages/lecturer/MyUnits';
import LecturerStudents from './pages/lecturer/Students';
import LecturerAssessments from './pages/lecturer/Assessments';
import LecturerAttendance from './pages/lecturer/Attendance';
import LecturerResults from './pages/lecturer/Results';
import LecturerOnlineClasses from './pages/lecturer/OnlineClasses';
import LecturerMaterials from './pages/lecturer/Materials';
import LecturerProfile from './pages/lecturer/Profile';

// ============ FINANCE PAGES ============
import FinanceDashboard from './pages/finance/Dashboard';
import FinancePayments from './pages/finance/Payments';
import FinanceReceipts from './pages/finance/Receipts';
import FinanceExamCards from './pages/finance/ExamCards';
import FinanceFeeStructures from './pages/finance/FeeStructures';
import FinanceReports from './pages/finance/Reports';
import FinanceSettings from './pages/finance/Settings';

// ============ FACULTY OFFICER PAGES ============
import FacultyOfficerDashboard from './pages/facultyOfficer/Dashboard';
import FacultyOfficerStudents from './pages/facultyOfficer/Students';
import FacultyOfficerDepartments from './pages/facultyOfficer/Departments';
import FacultyOfficerLecturers from './pages/facultyOfficer/Lecturers';
import FacultyOfficerRegistrations from './pages/facultyOfficer/Registrations';
import FacultyOfficerResults from './pages/facultyOfficer/Results';
import FacultyOfficerUnits from './pages/facultyOfficer/Units';
import FacultyOfficerReports from './pages/facultyOfficer/Reports';
import FacultyOfficerStudentCards from './pages/facultyOfficer/StudentCards'; // NEW

// ============ COLLEGE OFFICER PAGES ============
import CollegeOfficerDashboard from './pages/collegeOfficer/Dashboard';
import CollegeOfficerStudents from './pages/collegeOfficer/Students';
import CollegeOfficerProgrammes from './pages/collegeOfficer/Programmes';
import CollegeOfficerRegistrations from './pages/collegeOfficer/Registrations';
import CollegeOfficerResults from './pages/collegeOfficer/Results';
import CollegeOfficerUnits from './pages/collegeOfficer/Units';
import CollegeOfficerReports from './pages/collegeOfficer/Reports';
import CollegeOfficerStudentCards from './pages/collegeOfficer/StudentCards'; // NEW

// ============ PROTECTED ROUTE WRAPPER ============
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('role');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ============ ROLE-BASED REDIRECT ============
const RoleRedirect = () => {
  const role = localStorage.getItem('role');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  switch (role) {
    case 'Admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Student':
      return <Navigate to="/student/dashboard" replace />;
    case 'Lecturer':
      return <Navigate to="/lecturer/dashboard" replace />;
    case 'Finance Officer':
      return <Navigate to="/finance/dashboard" replace />;
    case 'Faculty Officer':
      return <Navigate to="/faculty-officer/dashboard" replace />;
    case 'College Officer':
      return <Navigate to="/college-officer/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES with Navbar and Footer ===== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/colleges/:id" element={<CollegeDetail />} />
          <Route path="/colleges/:id/faculties" element={<Faculties />} />
          <Route path="/faculties" element={<Faculties />} />
          <Route path="/faculties/:id" element={<FacultyDetail />} />
          <Route path="/faculties/:id/departments" element={<DepartmentDetail />} />
          <Route path="/departments/:id" element={<DepartmentDetail />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RoleRedirect />} />
        </Route>

        {/* ===== STUDENT ROUTES with StudentLayout ===== */}
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRole="Student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute requiredRole="Student">
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="/student/my-units" element={
            <ProtectedRoute requiredRole="Student">
              <StudentMyUnits />
            </ProtectedRoute>
          } />
          <Route path="/student/payments" element={
            <ProtectedRoute requiredRole="Student">
              <StudentPayments />
            </ProtectedRoute>
          } />
          <Route path="/student/results" element={
            <ProtectedRoute requiredRole="Student">
              <StudentResults />
            </ProtectedRoute>
          } />
          <Route path="/student/exam-card" element={
            <ProtectedRoute requiredRole="Student">
              <StudentExamCard />
            </ProtectedRoute>
          } />
          <Route path="/student/student-card" element={
            <ProtectedRoute requiredRole="Student">
              <StudentCard />
            </ProtectedRoute>
          } />
          <Route path="/student/register-semester" element={
            <ProtectedRoute requiredRole="Student">
              <RegisterSemester />
            </ProtectedRoute>
          } />
          <Route path="/student/register-units" element={
            <ProtectedRoute requiredRole="Student">
              <RegisterUnits />
            </ProtectedRoute>
          } />
          <Route path="/student/fee-structure" element={
            <ProtectedRoute requiredRole="Student">
              <FeeStructure />
            </ProtectedRoute>
          } />
          <Route path="/student/announcements" element={
            <ProtectedRoute requiredRole="Student">
              <StudentAnnouncements />
            </ProtectedRoute>
          } />
          <Route path="/student/assessments" element={
            <ProtectedRoute requiredRole="Student">
              <StudentAssessments />
            </ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute requiredRole="Student">
              <StudentAttendance />
            </ProtectedRoute>
          } />
          <Route path="/student/online-classes" element={
            <ProtectedRoute requiredRole="Student">
              <StudentOnlineClasses />
            </ProtectedRoute>
          } />
          <Route path="/student/receipts" element={
            <ProtectedRoute requiredRole="Student">
              <StudentReceipts />
            </ProtectedRoute>
          } />
          <Route path="/student/settings" element={
            <ProtectedRoute requiredRole="Student">
              <StudentSettings />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== ADMIN ROUTES with AdminLayout ===== */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin/students/:id" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminStudentDetails />
            </ProtectedRoute>
          } />
          <Route path="/admin/lecturers" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminLecturers />
            </ProtectedRoute>
          } />
          <Route path="/admin/colleges" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminColleges />
            </ProtectedRoute>
          } />
          <Route path="/admin/faculties" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminFaculties />
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDepartments />
            </ProtectedRoute>
          } />
          <Route path="/admin/programmes" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminProgrammes />
            </ProtectedRoute>
          } />
          <Route path="/admin/units" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminUnits />
            </ProtectedRoute>
          } />
          <Route path="/admin/semesters" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminSemesters />
            </ProtectedRoute>
          } />
          <Route path="/admin/academic-years" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminAcademicYears />
            </ProtectedRoute>
          } />
          <Route path="/admin/fee-structures" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminFeeStructures />
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminPayments />
            </ProtectedRoute>
          } />
          <Route path="/admin/results" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminResults />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/announcements" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminAnnouncements />
            </ProtectedRoute>
          } />
          <Route path="/admin/online-classes" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminOnlineClasses />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/finance-staff" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminFinanceStaff />
            </ProtectedRoute>
          } />
          <Route path="/admin/faculty-officers" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminFacultyOfficers />
            </ProtectedRoute>
          } />
          <Route path="/admin/college-officers" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminCollegeOfficers />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== LECTURER ROUTES with LecturerLayout ===== */}
        <Route element={<LecturerLayout />}>
          <Route path="/lecturer/dashboard" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/my-units" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerMyUnits />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/students" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerStudents />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/assessments" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerAssessments />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/attendance" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerAttendance />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/results" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerResults />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/online-classes" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerOnlineClasses />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/materials" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerMaterials />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/profile" element={
            <ProtectedRoute requiredRole="Lecturer">
              <LecturerProfile />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== FINANCE ROUTES with FinanceLayout ===== */}
        <Route element={<FinanceLayout />}>
          <Route path="/finance/dashboard" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/finance/payments" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinancePayments />
            </ProtectedRoute>
          } />
          <Route path="/finance/receipts" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceReceipts />
            </ProtectedRoute>
          } />
          <Route path="/finance/exam-cards" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceExamCards />
            </ProtectedRoute>
          } />
          <Route path="/finance/fee-structures" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceFeeStructures />
            </ProtectedRoute>
          } />
          <Route path="/finance/reports" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceReports />
            </ProtectedRoute>
          } />
          <Route path="/finance/settings" element={
            <ProtectedRoute requiredRole="Finance Officer">
              <FinanceSettings />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== FACULTY OFFICER ROUTES ===== */}
        <Route element={<FacultyOfficerLayout />}>
          <Route path="/faculty-officer/dashboard" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/students" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerStudents />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/departments" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerDepartments />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/lecturers" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerLecturers />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/registrations" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerRegistrations />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/results" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerResults />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/units" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerUnits />
            </ProtectedRoute>
          } />
          <Route path="/faculty-officer/reports" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerReports />
            </ProtectedRoute>
          } />
          {/* NEW: Faculty Officer Student Cards */}
          <Route path="/faculty-officer/student-cards" element={
            <ProtectedRoute requiredRole="Faculty Officer">
              <FacultyOfficerStudentCards />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== COLLEGE OFFICER ROUTES ===== */}
        <Route element={<CollegeOfficerLayout />}>
          <Route path="/college-officer/dashboard" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/students" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerStudents />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/programmes" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerProgrammes />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/registrations" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerRegistrations />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/results" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerResults />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/units" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerUnits />
            </ProtectedRoute>
          } />
          <Route path="/college-officer/reports" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerReports />
            </ProtectedRoute>
          } />
          {/* NEW: College Officer Student Cards */}
          <Route path="/college-officer/student-cards" element={
            <ProtectedRoute requiredRole="College Officer">
              <CollegeOfficerStudentCards />
            </ProtectedRoute>
          } />
        </Route>

        {/* ===== 404 NOT FOUND ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;