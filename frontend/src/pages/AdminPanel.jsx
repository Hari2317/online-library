import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Settings, Plus, BookOpen, ClipboardList, AlertCircle, CheckCircle, BarChart, TrendingUp, Users, DollarSign, Download, Upload } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('books');
  
  // Book State
  const [books, setBooks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', totalCopies: 1, availableCopies: 1, borrowPeriodDays: 180, coverImage: ''
  });

  // Transaction State
  const [transactions, setTransactions] = useState([]);
  
  // Return Modal State
  const [returnModalTxnId, setReturnModalTxnId] = useState(null);
  const [customReturnDate, setCustomReturnDate] = useState('');

  // Reports State
  const [reportsData, setReportsData] = useState({
    mostBorrowed: [],
    userActivity: [],
    fines: { totalFinesGenerated: 0, totalFinesCollected: 0, totalPendingFines: 0 },
    usage: { year: new Date().getFullYear(), monthlyStats: [] }
  });

  const [proofModalImg, setProofModalImg] = useState(null);
  const [upiQrBase64, setUpiQrBase64] = useState('');

  useEffect(() => {
    if (activeTab === 'books') {
      fetchBooks();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    try {
      const [mbRes, uaRes, fRes, usRes] = await Promise.all([
        api.get('/reports/most-borrowed'),
        api.get('/reports/user-activity'),
        api.get('/reports/fines'),
        api.get('/reports/usage')
      ]);
      setReportsData({
        mostBorrowed: mbRes.data.data.mostBorrowed,
        userActivity: uaRes.data.data.userActivity,
        fines: fRes.data.data.fineStats,
        usage: usRes.data.data
      });
    } catch (err) {
      toast.error('Failed to load reports');
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings/upi_qr_code');
      if (data?.data?.setting) setUpiQrBase64(data.data.setting);
    } catch (err) {}
  };

  const saveSettings = async () => {
    try {
      await api.post('/settings/upi_qr_code', { value: upiQrBase64 });
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setUpiQrBase64(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    let csv = 'User Name,Email,Total Borrowed,Active Borrows,Unpaid Fines\n';
    reportsData.userActivity.forEach(u => {
      csv += `"${u.name}","${u.email}",${u.totalBorrowed},${u.activeBorrows},${u.unpaidFines}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- Book API ---
  const fetchBooks = async () => {
    try {
      const { data } = await api.get('/books');
      setBooks(data.data.books);
    } catch (err) {
      toast.error('Failed to load books');
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBookId) {
        await api.patch(`/books/${editingBookId}`, formData);
        toast.success('Book updated successfully');
      } else {
        await api.post('/books', formData);
        toast.success('Book created successfully');
      }
      setFormData({ title: '', author: '', isbn: '', totalCopies: 1, availableCopies: 1, borrowPeriodDays: 180, coverImage: '' });
      setIsAdding(false);
      setEditingBookId(null);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save book');
    }
  };

  const handleEditClick = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies ?? book.totalCopies,
      borrowPeriodDays: book.borrowPeriodDays || 180,
      coverImage: book.coverImage || ''
    });
    setEditingBookId(book._id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete book');
    }
  };

  // --- Transaction API ---
  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data.data.transactions);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  };

  const openReturnModal = (txnId) => {
    setReturnModalTxnId(txnId);
    setCustomReturnDate(new Date().toISOString().split('T')[0]);
  };

  const handleReturnBook = async () => {
    try {
      await api.post('/transactions/return', { 
         transactionId: returnModalTxnId,
         returnDate: customReturnDate || undefined
      });
      toast.success('Book marked as returned');
      setReturnModalTxnId(null);
      fetchTransactions();
      fetchBooks(); // refresh copies
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handlePayFine = async (transactionId) => {
    try {
      await api.put(`/transactions/${transactionId}/pay-fine`);
      toast.success('Fine marked as paid');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pay fine');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
        <h1 className="text-3xl font-bold text-brand-900 flex items-center gap-3 font-serif">
          <Settings className="text-accent-500 w-8 h-8" /> Librarian Management
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 max-w-2xl mx-auto">
        <button 
          onClick={() => setActiveTab('books')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all ${activeTab === 'books' ? 'bg-brand-800 text-white shadow-md' : 'text-gray-500 hover:text-brand-700 hover:bg-gray-50'}`}
        >
          <BookOpen size={20} /> Book Inventory
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all ${activeTab === 'transactions' ? 'bg-brand-800 text-white shadow-md' : 'text-gray-500 hover:text-brand-700 hover:bg-gray-50'}`}
        >
          <ClipboardList size={20} /> Transactions & Fines
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all ${activeTab === 'reports' ? 'bg-brand-800 text-white shadow-md' : 'text-gray-500 hover:text-brand-700 hover:bg-gray-50'}`}
        >
          <BarChart size={20} /> Reports
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-800 text-white shadow-md' : 'text-gray-500 hover:text-brand-700 hover:bg-gray-50'}`}
        >
          <Settings size={20} /> Settings
        </button>
      </div>

      {/* Books Tab Content */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="flex justify-end">
              <button
              onClick={() => {
                setIsAdding(!isAdding);
                if (isAdding) {
                  setFormData({ title: '', author: '', isbn: '', totalCopies: 1, availableCopies: 1, borrowPeriodDays: 180, coverImage: '' });
                  setEditingBookId(null);
                }
              }}
              className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 border border-brand-700"
            >
              {isAdding ? 'Cancel' : <><Plus size={20} /> Add New Book</>}
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleSaveBook} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Author</label>
                  <input required type="text" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.author} onChange={e=>setFormData({...formData, author: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">ISBN</label>
                  <input required type="text" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.isbn} onChange={e=>setFormData({...formData, isbn: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Total Copies</label>
                  <input required type="number" min="1" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.totalCopies} onChange={e=>setFormData({...formData, totalCopies: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Available Copies</label>
                  <input required type="number" min="0" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.availableCopies} onChange={e=>setFormData({...formData, availableCopies: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Borrow Duration (Days)</label>
                  <input required type="number" min="1" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.borrowPeriodDays} onChange={e=>setFormData({...formData, borrowPeriodDays: parseInt(e.target.value) || 180})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Cover Image URL</label>
                  <input type="text" className="w-full border p-2 rounded-lg focus:ring focus:ring-brand-200 focus:outline-none" 
                         value={formData.coverImage} onChange={e=>setFormData({...formData, coverImage: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-accent-500 hover:bg-accent-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border border-accent-600">
                {editingBookId ? 'Update Book Details' : 'Save Book Details'}
              </button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title & Author</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ISBN</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Inventory</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map(book => (
                    <tr key={book._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{book.title}</div>
                        <div className="text-gray-500 text-sm">{book.author}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{book.isbn}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {book.availableCopies} available / {book.totalCopies} total
                      </td>
                      <td className="px-6 py-4 text-center space-x-4">
                        <button onClick={() => handleEditClick(book)} className="text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(book._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr>
                       <td colSpan="4" className="text-center py-6 text-gray-500">No books found in inventory.</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Transactions Tab Content */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Book</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fine</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(txn => (
                    <tr key={txn._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{txn.user?.name}</div>
                        <div className="text-gray-500 text-sm">{txn.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{txn.book?.title}</div>
                        <div className="text-gray-500 text-xs">Due: {new Date(txn.dueDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold tracking-wider uppercase rounded-md shadow-sm border ${
                          txn.status === 'returned' ? 'bg-green-50 text-green-700 border-green-200' : 
                          txn.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-brand-50 text-brand-700 border-brand-200'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {txn.fineAmount > 0 ? (
                           <div className="flex items-center gap-1">
                             <span className="font-bold text-red-600">${txn.fineAmount}</span>
                             {txn.finePaid ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
                           </div>
                        ) : (
                           <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center space-x-3">
                         {(txn.status === 'borrowed' || txn.status === 'overdue') && (
                         <button 
                           onClick={() => openReturnModal(txn._id)} 
                           className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                         >
                           Return
                         </button>
                       )}  {(txn.fineAmount > 0 && !txn.finePaid && txn.paymentStatus !== 'pending_verification') && (
                           <button onClick={() => handlePayFine(txn._id)} className="text-green-600 hover:text-green-800 font-medium text-sm bg-green-50 px-2 py-1 rounded">
                             Pay Fine
                           </button>
                         )}
                         {txn.paymentStatus === 'pending_verification' && (
                             <div className="flex gap-2 justify-center">
                               <button onClick={() => setProofModalImg(txn.paymentProof)} className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 px-2 py-1 rounded">View Proof</button>
                               <button onClick={() => handlePayFine(txn._id)} className="text-white hover:text-white font-medium text-sm bg-green-500 px-2 py-1 rounded">Verify</button>
                             </div>
                         )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                       <td colSpan="5" className="text-center py-6 text-gray-500">No transactions found.</td>
                    </tr>
                  )}
                </tbody>
             </table>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-end">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-brand-100 text-brand-800 px-4 py-2 rounded-xl font-bold hover:bg-brand-200 transition-colors">
              <Download size={20} /> Export CSV
            </button>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Collected Fines</p>
                <p className="text-2xl font-bold text-gray-900">${reportsData.fines.totalFinesCollected}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Fines</p>
                <p className="text-2xl font-bold text-gray-900">${reportsData.fines.totalPendingFines}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><Users size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Borrowers</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.userActivity.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Monthly Usage</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.usage.monthlyStats.reduce((sum, item) => sum + item.borrowCount, 0)} Books ({reportsData.usage.year})</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Most Borrowed Books */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BookOpen size={20} className="text-brand-600" /> Most Borrowed Books</h2></div>
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Book</th><th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Borrows</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportsData.mostBorrowed.map((b, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{b.title} <span className="text-xs text-gray-500 font-normal block">{b.author}</span></td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-700 text-right">{b.borrowCount}</td>
                      </tr>
                    ))}
                    {reportsData.mostBorrowed.length === 0 && <tr><td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">No data available</td></tr>}
                  </tbody>
               </table>
            </div>
            {/* User Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users size={20} className="text-brand-600" /> User Activity</h2></div>
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th><th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total</th><th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Active</th><th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Fines</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportsData.userActivity.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{u.name} <span className="text-xs text-gray-500 font-normal block">{u.email}</span></td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-700 text-center">{u.totalBorrowed}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-center">{u.activeBorrows}</td>
                        <td className="px-6 py-3 text-sm text-red-600 font-medium text-right">${u.unpaidFines}</td>
                      </tr>
                    ))}
                    {reportsData.userActivity.length === 0 && <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No data available</td></tr>}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="text-brand-600" /> Payment Settings</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Global UPI QR Code</label>
            <div className="flex items-center gap-6">
              {upiQrBase64 ? (
                 <img src={upiQrBase64} alt="UPI QR" className="w-32 h-32 border rounded-lg shadow-sm" />
              ) : (
                 <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">No QR</div>
              )}
              <div className="space-y-3">
                <input type="file" accept="image/*" onChange={handleQrUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
                <p className="text-xs text-gray-500">Upload your library's official UPI QR Code to allow students to pay fines digitally.</p>
              </div>
            </div>
          </div>
          
          <button onClick={saveSettings} className="bg-brand-800 hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all">
            Save Settings
          </button>
        </div>
      )}

      {/* Proof Modal */}
      {proofModalImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setProofModalImg(null)}>
          <div className="bg-white rounded-xl p-2 max-w-2xl max-h-[90vh] overflow-auto">
            <img src={proofModalImg} alt="Payment Proof" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}

      {/* Return Modal Date Picker */}
      {returnModalTxnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in text-center">
            <h3 className="text-xl font-bold mb-4">Choose Return Date</h3>
            <p className="text-sm text-gray-500 mb-4">Set a custom return date to simulate late returns and test fines.</p>
            <input 
              type="date"
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-200 mb-5"
              value={customReturnDate}
              onChange={(e) => setCustomReturnDate(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setReturnModalTxnId(null)} 
                className="px-4 py-2 font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleReturnBook} 
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
