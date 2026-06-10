const express = require('express');
const router = express.Router();
const User = require('../models/User');

const sanitizeUserPayload = (payload = {}) => {
  const { username, email, password, workerType, monthlySalary, wagePerDay } = payload;

  const cleanWorkerType = workerType === 'permanent' ? 'permanent' : 'daily_wage';
  const cleanMonthlySalary = monthlySalary === '' || monthlySalary === undefined || monthlySalary === null
    ? null
    : Number(monthlySalary);
  const cleanWagePerDay = wagePerDay === '' || wagePerDay === undefined || wagePerDay === null
    ? null
    : Number(wagePerDay);

  return {
    cleanUsername: typeof username === 'string' ? username.trim() : '',
    cleanEmail: typeof email === 'string' ? email.trim().toLowerCase() : '',
    cleanPassword: typeof password === 'string' ? password : '',
    cleanWorkerType,
    cleanMonthlySalary: Number.isFinite(cleanMonthlySalary) ? cleanMonthlySalary : null,
    cleanWagePerDay: Number.isFinite(cleanWagePerDay) ? cleanWagePerDay : null,
  };
};

const buildWorkerFields = ({ cleanWorkerType, cleanMonthlySalary, cleanWagePerDay }) => {
  if (cleanWorkerType === 'permanent') {
    return {
      workerType: cleanWorkerType,
      monthlySalary: cleanMonthlySalary,
      wagePerDay: null,
    };
  }

  return {
    workerType: cleanWorkerType,
    monthlySalary: null,
    wagePerDay: cleanWagePerDay,
  };
};

const createUserByRole = async (req, res, role, label) => {
  try {
    const { cleanUsername, cleanEmail, cleanPassword, ...workerFields } = sanitizeUserPayload(req.body);

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (role === 'rancher') {
      if (workerFields.cleanWorkerType === 'permanent' && !Number.isFinite(workerFields.cleanMonthlySalary)) {
        return res.status(400).json({ message: 'Monthly salary is required for permanent workers' });
      }
      if (workerFields.cleanWorkerType === 'daily_wage' && !Number.isFinite(workerFields.cleanWagePerDay)) {
        return res.status(400).json({ message: 'Wage per day is required for daily wage workers' });
      }
    }

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPassword,
      role,
      ...(role === 'rancher' ? buildWorkerFields(workerFields) : {}),
    });

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      message: `${label} account created successfully`,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.get('/ranchers', async (req, res) => {
  try {
    const ranchers = await User.find({ role: 'rancher' }).select('-password').sort({ createdAt: -1 });
    res.json(ranchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/ranchers', async (req, res) => {
  return createUserByRole(req, res, 'rancher', 'Rancher');
});

router.put('/ranchers/:id', async (req, res) => {
  try {
    const { cleanUsername, cleanEmail, cleanPassword, ...workerFields } = sanitizeUserPayload(req.body);
    const user = await User.findOne({ _id: req.params.id, role: 'rancher' });
    if (!user) return res.status(404).json({ message: 'Rancher not found' });

    if (cleanUsername) user.username = cleanUsername;
    if (cleanEmail) user.email = cleanEmail;
    if (cleanPassword) user.password = cleanPassword;

    if (workerFields.cleanWorkerType) {
      const nextWorkerFields = buildWorkerFields(workerFields);
      user.workerType = nextWorkerFields.workerType;
      user.monthlySalary = nextWorkerFields.monthlySalary;
      user.wagePerDay = nextWorkerFields.wagePerDay;
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    res.json({ message: 'Rancher updated successfully', user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/ranchers/:id', async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ _id: req.params.id, role: 'rancher' });
    if (!result) return res.status(404).json({ message: 'Rancher not found' });
    res.json({ message: 'Rancher deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/shopkeepers', async (req, res) => {
  try {
    const shopkeepers = await User.find({ role: 'shopkeeper' }).select('-password').sort({ createdAt: -1 });
    res.json(shopkeepers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/shopkeepers', async (req, res) => {
  return createUserByRole(req, res, 'shopkeeper', 'Shopkeeper');
});

router.delete('/shopkeepers/:id', async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ _id: req.params.id, role: 'shopkeeper' });
    if (!result) return res.status(404).json({ message: 'Shopkeeper not found' });
    res.json({ message: 'Shopkeeper deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
