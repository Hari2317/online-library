const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const sendEmail = require('./email');

// Schedule tasks to be run on the server.
const initCronJobs = () => {
  // Run everyday at 8:00 AM ('0 8 * * *')
  // Using exactly '0 8 * * *' will trigger once a day. For testing, it could be '* * * * *' (every minute)
  // For production, daily is preferred.
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily cron job for DUE DATE REMINDERS at 8:00 AM');
    try {
      const today = new Date();
      // Calculate end of tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Find all transactions that are borrowed and due on or before tomorrow
      const dueTransactions = await Transaction.find({
        status: { $in: ['borrowed', 'overdue'] },
        dueDate: { $lte: tomorrow },
        returnDate: null
      }).populate('user', 'name email');

      console.log(`Found ${dueTransactions.length} transactions due soon or overdue.`);

      for (const txn of dueTransactions) {
        if (txn.user && txn.user.email) {
          const reminderHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2 style="color: #ea580c;">Library Due Date Reminder</h2>
              <p>Hello <strong>${txn.user.name || txn.userName}</strong>,</p>
              <p>This is a reminder from the RIT Library regarding a book you currently have borrowed. It is due soon or might already be overdue.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Book Title:</strong> ${txn.bookName}</p>
                <p style="margin: 5px 0 0 0; color: #dc2626;"><strong>Due Date:</strong> ${new Date(txn.dueDate).toLocaleDateString()}</p>
              </div>
              <p>Please return the book as soon as possible to avoid any further late fees.</p>
              <br>
              <p>Best regards,<br>The RIT Library Team</p>
            </div>
          `;

          await sendEmail({
            email: txn.user.email,
            subject: 'Action Required: Book Return Reminder',
            html: reminderHtml
          });
          
          console.log(`Reminder email sent to ${txn.user.email} for book ${txn.bookName}`);
        }
      }
    } catch (err) {
      console.error('Error running cron job:', err);
    }
  });

  console.log('Cron jobs initialized successfully.');
};

module.exports = initCronJobs;
