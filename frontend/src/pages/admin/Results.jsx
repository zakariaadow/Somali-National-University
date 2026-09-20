import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

const AdminResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [units, setUnits] = useState([]);
  const [filterSemester, setFilterSemester] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
      navigate('/login');
      return;
    }

    fetchSemesters();
    fetchUnits();
    fetchResults();
  }, [navigate]);

  const fetchSemesters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/semesters?is_active=true`, {
        withCredentials: true
      });
      setSemesters(response.data.semesters || []);
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/units?is_active=true`, {
        withCredentials: true
      });
      setUnits(response.data.units || []);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        per_page: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(filterSemester && { semester_id: filterSemester }),
        ...(filterUnit && { unit_id: filterUnit })
      });
      const response = await axios.get(`${API_BASE_URL}/admin/results?${params}`, {
        withCredentials: true
      });
      setResults(response.data.results || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page > 1 || searchTerm || filterSemester || filterUnit) {
      fetchResults();
    }
  }, [page, searchTerm, filterSemester, filterUnit]);

  const handlePublish = async (resultId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/results/${resultId}/publish`,
        {},
        { withCredentials: true }
      );
      fetchResults();
    } catch (err) {
      console.error('Error publishing result:', err);
      setError('Failed to publish result.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Results</h1>
              <p className="text-gray-600">Manage student results</p>
            </div>
            <div className="text-sm text-gray-500">
              Total: {total} results
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by student or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-48">
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_code}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setPage(1);
                fetchResults();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No results found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.unit_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.grade === 'F' ? 'bg-red-100 text-red-800' :
                          result.grade === 'A' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {result.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.score ? result.score.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!result.is_published && (
                          <button
                            onClick={() => handlePublish(result.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;