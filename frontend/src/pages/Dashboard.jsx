import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { History, CheckCircle, Clock, Upload } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [paymentModalTx, setPaymentModalTx] = useState(null);
  const [paymentProofBase64, setPaymentProofBase64] = useState('');

  useEffect(() => {
    fetchHistory();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings/upi_qr_code');
      setQrCode(data.data.setting);
    } catch (err) {}
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/transactions/my-history');
      setHistory(data.data.transactions);
    } catch (err) {
      toast.error('Failed to load borrowing history');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (transactionId) => {
    try {
      await api.post('/transactions/return', { transactionId });
      toast.success('Book returned successfully!');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPayment = async () => {
    if (!paymentProofBase64) return toast.error('Please upload a screenshot proof');
    try {
      await api.post(`/transactions/${paymentModalTx._id}/submit-payment`, { paymentProof: paymentProofBase64 });
      toast.success('Payment submitted for verification!');
      setPaymentModalTx(null);
      setPaymentProofBase64('');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-brand-50 text-brand-800 border border-brand-100 rounded-2xl flex items-center justify-center text-3xl font-bold font-serif shadow-inner">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Welcome, {user?.name}</h1>
          <p className="text-gray-500 capitalize">{user?.role} Account Access</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2 mb-6 font-serif border-b border-gray-200 pb-3">
          <History className="text-accent-500" /> My Borrowing History
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="spinner border-t-brand-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-sm text-center text-gray-500 border border-gray-100 italic">
            You haven't borrowed any books yet.
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Fine</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm font-medium text-gray-900">{tx.book?.title || 'Unknown Book'}</div>
                        <div className="text-sm text-gray-500">{tx.book?.author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold tracking-wider uppercase rounded-md shadow-sm border ${
                          tx.status === 'returned' ? 'bg-green-50 text-green-700 border-green-200' :
                          tx.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-brand-50 text-brand-700 border-brand-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tx.fineAmount > 0 ? (
                           <div className="flex items-center justify-center gap-1">
                             <span className="font-bold text-red-600">${tx.fineAmount}</span>
                           </div>
                        ) : (
                           <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        {(tx.status === 'borrowed' || tx.status === 'overdue') && (
                          <button
                            onClick={() => handleReturn(tx._id)}
                            className="text-brand-700 bg-brand-50 hover:bg-brand-800 hover:text-white border border-brand-200 hover:border-brand-800 font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            Return
                          </button>
                        )}
                        {tx.fineAmount > 0 && !tx.finePaid && !tx.paymentStatus && (
                          <button
                            onClick={() => { setPaymentModalTx(tx); setPaymentProofBase64(''); }}
                            className="text-white bg-blue-600 hover:bg-blue-700 font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            Pay Fine
                          </button>
                        )}
                        {tx.paymentStatus === 'pending_verification' && (
                           <span className="text-yellow-600 font-medium">Pending Verification</span>
                        )}
                        {tx.finePaid && tx.status === 'returned' && (
                          <span className="text-gray-400">Returned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in text-center">
            <h3 className="text-xl font-bold mb-2">Pay Your Fine</h3>
            <p className="text-sm text-gray-500 mb-4">Total Amount Due: <span className="text-red-600 font-bold">${paymentModalTx.fineAmount}</span></p>
            
            {qrCode ? (
              <div className="mb-4 flex flex-col items-center">
                <img src={qrCode} alt="UPI QR Code" className="w-48 h-48 border border-gray-200 rounded-lg shadow-sm" />
                <p className="text-xs text-gray-400 mt-2">Scan with any UPI App</p>
              </div>
            ) : (
              <div className="mb-4 text-gray-500 italic p-4 bg-gray-50 rounded-lg">UPI QR not configured by Admin.</div>
            )}

            <div className="text-left mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Payment Screenshot</label>
              <input type="file" accept="image/*" onChange={handleProofChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setPaymentModalTx(null)} className="px-4 py-2 font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={submitPayment} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Submit Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
