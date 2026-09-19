import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaReceipt, FaDownload, FaPrint, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await axios.get('/api/receipts/my-receipts');
      setReceipts(res.data);
    } catch (error) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (id) => {
    try {
      const res = await axios.get(`/api/receipts/${id}`);
      setSelectedReceipt(res.data);
    } catch (error) {
      toast.error('Failed to load receipt details');
    }
  };

  const getReceiptTypeBadge = (type) => {
    const styles = {
      payment: 'bg-blue-100 text-blue-800',
      card_fee: 'bg-purple-100 text-purple-800',
      registration: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || styles.payment}`}>
        {type?.replace('_', ' ').toUpperCase() || 'PAYMENT'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Receipts</h2>
        <span className="text-sm text-gray-500">
          Total: {receipts.length} receipt(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.length === 0 ? (
          <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
            <FaReceipt className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No receipts found</p>
            <p className="text-sm text-gray-400">Payments you make will appear here</p>
          </div>
        ) : (
          receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => handleViewReceipt(receipt.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-sm text-gray-600">{receipt.receipt_number}</p>
                  {getReceiptTypeBadge(receipt.receipt_type)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewReceipt(receipt.id);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEye />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-lg font-bold text-gray-800">
                  KES {receipt.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 truncate">{receipt.description}</p>
              </div>

              <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
                <span className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implement download/print functionality
                      toast.success('Receipt downloaded');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaDownload />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.print();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaPrint />
                  </button>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Receipt Details</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt Number</span>
                <span className="font-mono">{selectedReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Student</span>
                <span>{selectedReceipt.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-lg">
                  KES {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description</span>
                <span>{selectedReceipt.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span>{getReceiptTypeBadge(selectedReceipt.receipt_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="capitalize">{selectedReceipt.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono">{selectedReceipt.payment_reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date</span>
                <span>{new Date(selectedReceipt.issue_date).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                  setSelectedReceipt(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <FaPrint /> Print
              </button>
              <button
                onClick={() => {
                  // Implement PDF download
                  toast.success('Downloading receipt...');
                }}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <FaDownload /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;