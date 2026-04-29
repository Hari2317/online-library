const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');

// 1. Most Borrowed Books Report
exports.getMostBorrowedBooks = async (req, res, next) => {
  try {
    const mostBorrowed = await Transaction.aggregate([
      {
        $group: {
          _id: '$book',
          bookName: { $first: '$bookName' },
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 }
    ]);

    // Populate additional book details if needed
    const populated = await Book.populate(mostBorrowed, { path: '_id', select: 'author coverImage category' });

    res.status(200).json({
      status: 'success',
      data: {
        mostBorrowed: populated.map(b => ({
          bookId: b._id ? b._id._id : null,
          title: b.bookName,
          author: b._id ? b._id.author : 'Unknown',
          coverImage: b._id ? b._id.coverImage : null,
          borrowCount: b.borrowCount
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. User Activity Report
exports.getUserActivity = async (req, res, next) => {
  try {
    const activity = await Transaction.aggregate([
      {
        $group: {
          _id: '$user',
          userName: { $first: '$userName' },
          totalBorrowed: { $sum: 1 },
          activeBorrows: {
            $sum: { $cond: [{ $in: ['$status', ['borrowed', 'overdue']] }, 1, 0] }
          },
          totalFines: { $sum: '$fineAmount' },
          unpaidFines: {
            $sum: { $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0] }
          }
        }
      },
      { $sort: { totalBorrowed: -1 } },
      { $limit: 20 }
    ]);

    const populated = await User.populate(activity, { path: '_id', select: 'email role' });

    res.status(200).json({
      status: 'success',
      data: {
        userActivity: populated.map(u => ({
          userId: u._id ? u._id._id : null,
          name: u.userName,
          email: u._id ? u._id.email : 'Unknown',
          role: u._id ? u._id.role : 'Unknown',
          totalBorrowed: u.totalBorrowed,
          activeBorrows: u.activeBorrows,
          totalFines: u.totalFines,
          unpaidFines: u.unpaidFines
        }))
      }
    });

  } catch (err) {
    next(err);
  }
};

// 3. Fine Collection Report
exports.getFineCollection = async (req, res, next) => {
  try {
    const fines = await Transaction.aggregate([
      {
        $match: { fineAmount: { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          totalFinesGenerated: { $sum: '$fineAmount' },
          totalFinesCollected: {
            $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] }
          },
          totalPendingFines: {
            $sum: { $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        fineStats: fines.length > 0 ? fines[0] : { totalFinesGenerated: 0, totalFinesCollected: 0, totalPendingFines: 0 }
      }
    });
  } catch (err) {
    next(err);
  }
};

// 4. Monthly/Annual Usage Statistics
exports.getUsageStatistics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);

    const usage = await Transaction.aggregate([
      {
        $match: {
          issueDate: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$issueDate' },
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for 12 months
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      borrowCount: 0
    }));

    usage.forEach(stat => {
      monthlyStats[stat._id - 1].borrowCount = stat.borrowCount;
    });

    res.status(200).json({
      status: 'success',
      data: {
        year,
        monthlyStats
      }
    });
  } catch (err) {
    next(err);
  }
};
