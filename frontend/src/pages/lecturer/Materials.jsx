import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Materials = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'Lecturer') {
      navigate('/login');
      return;
    }

    const fetchUnits = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/lecturer/my-units`, {
          withCredentials: true
        });
        setUnits(response.data.units || []);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load units.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [navigate]);

  const handleUnitChange = (e) => {
    setSelectedUnit(e.target.value);
    // Fetch materials for this unit
    // This would be a new endpoint
    setMaterials([
      { id: 1, title: 'Lecture 1: Introduction', type: 'PDF', uploaded: '2024-01-15' },
      { id: 2, title: 'Lecture 2: Advanced Topics', type: 'PDF', uploaded: '2024-01-20' }
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Learning Materials</h1>
          <p className="text-gray-600">Upload and manage learning materials for your units.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Unit</label>
            <select
              value={selectedUnit}
              onChange={handleUnitChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a unit...</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_code} - {unit.unit_name}
                </option>
              ))}
            </select>
          </div>

          {selectedUnit && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to upload</p>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Upload Material
                </button>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Uploaded Materials</h3>
                {materials.length === 0 ? (
                  <p className="text-gray-500">No materials uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{material.title}</p>
                            <p className="text-sm text-gray-500">{material.type} • Uploaded: {material.uploaded}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                          <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Materials;