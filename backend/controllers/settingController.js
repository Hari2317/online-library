const Setting = require('../models/Setting');

// Get a setting by key
exports.getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key });
    
    // If setting is not found, return null without error
    res.status(200).json({
      status: 'success',
      data: {
        setting: setting ? setting.value : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update or create a setting (Admin only)
exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        setting: setting.value
      }
    });
  } catch (err) {
    next(err);
  }
};
