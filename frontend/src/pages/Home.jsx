import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { Search, Book as BookIcon } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data } = await api.get('/books');
      setBooks(data.data.books);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      await api.post('/transactions/borrow', { bookId });
      toast.success('Book requested successfully!');
      fetchBooks(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      <div className="text-center space-y-8 py-24 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 rounded-[2rem] shadow-2xl text-white relative overflow-hidden group border border-brand-700/30">
        <div className="absolute inset-0 bg-black opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 to-transparent"></div>
        <div className="relative z-10 px-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-xl mb-6 font-serif">
            RIT Library Catalog
          </h1>
          <p className="max-w-2xl mx-auto text-xl sm:text-2xl text-brand-100 font-light drop-shadow-md">
            The premier academic repository for research, reference, and reading.
          </p>
        </div>
        <div className="max-w-3xl mx-auto mt-12 relative px-6 z-10 transition-transform duration-300 hover:scale-[1.01]">
          <div className="absolute inset-y-0 left-6 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-brand-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-4 border-2 border-transparent rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-accent-500/30 focus:border-accent-400 sm:text-lg transition-all shadow-xl"
            placeholder="Search catalog by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-8">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-8 text-brand-900 font-serif border-b border-gray-200 pb-4">
          <BookIcon className="text-accent-500" /> Featured Collections
        </h2>
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-800 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredBooks.map(book => (
              <div key={book._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all duration-400 transform hover:-translate-y-1.5 group flex flex-col h-full">
                <div className="h-64 bg-gray-50 w-full relative overflow-hidden border-b border-gray-100">
                  {book.coverImage ? (
                    <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={book.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-50 text-brand-300 group-hover:bg-brand-100 transition-colors duration-500">
                      <BookIcon size={56} className="opacity-40" />
                    </div>
                  )}
                  {book.availableCopies < 1 && (
                     <div className="absolute top-4 right-4 bg-red-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                       Borrowed Out
                     </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1.5 group-hover:text-brand-700 transition-colors font-serif">{book.title}</h3>
                    <p className="text-sm text-gray-500 font-medium">{book.author}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                    <span className={`px-2.5 py-1 rounded-md font-semibold text-xs tracking-wide ${book.availableCopies > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {book.availableCopies} available
                    </span>
                    <span className="text-gray-400 text-xs font-mono">ISBN: {book.isbn || 'N/A'}</span>
                  </div>
                  {user && (
                    <button 
                      onClick={() => handleBorrow(book._id)}
                      disabled={book.availableCopies < 1}
                      className="w-full mt-5 bg-brand-800 hover:bg-brand-900 hover:shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent disabled:shadow-none text-white font-medium py-2.5 rounded-xl transition-all duration-300 border border-brand-700"
                    >
                      {book.availableCopies < 1 ? 'Unavailable' : 'Request to Borrow'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500">
                No books found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
