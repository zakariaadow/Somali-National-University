import React, { useState } from 'react';

const UploadPhoto = ({ onUpload, currentPhoto, label = 'Upload Photo' }) => {
  const [preview, setPreview] = useState(currentPhoto);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-full border-2 border-gray-300 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: JPEG, PNG (Max 5MB)
          </p>
        </div>

        {file && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-150"
          >
            Upload
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadPhoto;