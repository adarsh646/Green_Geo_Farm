const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;
    const cleanUsername = typeof username === 'string' ? username.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';
    const cleanRole = typeof role === 'string' ? role.trim().toLowerCase() : 'customer';

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const [existingCustomer, existingUser] = await Promise.all([
      Customer.findOne({
        $or: [{ username: cleanUsername }, { email: cleanEmail }],
      }),
      User.findOne({
        $or: [{ username: cleanUsername }, { email: cleanEmail }],
      }),
    ]);

    if (existingCustomer || existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    if (['rancher', 'admin', 'shopkeeper'].includes(cleanRole)) {
      const user = new User({
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        role: cleanRole
      });
      await user.save();
      return res.status(201).json({ message: `${cleanRole} registered successfully` });
    }

    const customer = new Customer({
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword,
    });

    await customer.save();
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

    console.log('Login attempt:', { email: cleanEmail, readyState: mongoose.connection.readyState, host: mongoose.connection.host, port: mongoose.connection.port, db: mongoose.connection.db?.databaseName });

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Back-office and shopkeeper users are authenticated from `users` collection.
    const appUser = await User.findOne({ email: cleanEmail });

    if (appUser) {
      const validPassword = await appUser.comparePassword(cleanPassword);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: appUser._id, role: appUser.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({
        token,
        username: appUser.username,
        role: appUser.role,
      });
    }

    // Shop customers are authenticated from dedicated `customers` collection.
    const customer = await Customer.findOne({ email: cleanEmail });
    if (!customer || !(await customer.comparePassword(cleanPassword))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: customer._id, role: 'customer' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: customer.username, role: 'customer' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
