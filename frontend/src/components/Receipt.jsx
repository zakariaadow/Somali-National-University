import React from 'react';

const Receipt = ({ receipt }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
        <p className="text-gray-500">Somali National University</p>
      </div>

      <div className="py-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Receipt Number</span>
          <span className="font-medium">{receipt.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment Reference</span>
          <span className="font-medium">{receipt.payment_reference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-bold text-lg">${receipt.amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment Method</span>
          <span className="font-medium">{receipt.payment_method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span className="font-medium">
            {new Date(receipt.generated_date).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`font-medium ${receipt.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
            {receipt.is_verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="border-t pt-4 text-center text-sm text-gray-500">
        <p>Thank you for your payment</p>
        <p>This receipt is generated automatically</p>
      </div>
    </div>
  );
};

export default Receipt;