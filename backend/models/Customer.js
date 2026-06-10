const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
}, { timestamps: true });

customerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  if (this.$locals && this.$locals.skipPasswordHash) return;
  this.password = await bcrypt.hash(this.password, 10);
});

customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
