const Customer = require('../models/Customer');
const User = require('../models/User');

const buildUniqueCustomerUsername = async (preferredUsername, userId) => {
  const base = (preferredUsername && preferredUsername.trim()) || `customer_${userId.toString().slice(-6)}`;
  let candidate = base;
  let counter = 1;

  while (await Customer.exists({ username: candidate })) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }

  return candidate;
};

const migrateLegacyCustomers = async () => {
  const legacyCustomers = await User.find({ role: 'customer' }).lean();

  if (!legacyCustomers.length) {
    return;
  }

  let migrated = 0;
  let deletedFromUsers = 0;
  let skipped = 0;

  for (const legacyCustomer of legacyCustomers) {
    const normalizedEmail =
      typeof legacyCustomer.email === 'string' ? legacyCustomer.email.trim().toLowerCase() : '';

    if (!normalizedEmail || !legacyCustomer.password) {
      skipped += 1;
      continue;
    }

    try {
      const existingCustomer = await Customer.findOne({ email: normalizedEmail });

      if (!existingCustomer) {
        const safeUsername = await buildUniqueCustomerUsername(
          legacyCustomer.username,
          legacyCustomer._id
        );

        const customer = new Customer({
          username: safeUsername,
          email: normalizedEmail,
          password: legacyCustomer.password,
          createdAt: legacyCustomer.createdAt,
          updatedAt: legacyCustomer.updatedAt,
        });

        customer.$locals = { skipPasswordHash: true };
        await customer.save();
        migrated += 1;
      } else {
        skipped += 1;
      }

      await User.deleteOne({ _id: legacyCustomer._id, role: 'customer' });
      deletedFromUsers += 1;
    } catch (error) {
      skipped += 1;
      console.error(
        `[Customer Migration] Skipped user ${legacyCustomer._id}: ${error.message}`
      );
    }
  }

  console.log(
    `[Customer Migration] Legacy customers: ${legacyCustomers.length}, migrated: ${migrated}, moved out of users: ${deletedFromUsers}, skipped: ${skipped}`
  );
};

module.exports = { migrateLegacyCustomers };

