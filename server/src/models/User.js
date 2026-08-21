const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default — must opt in with .select('+passwordHash')
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Authoritative balances. The frontend only ever displays these; it never
    // computes or sends them as trusted values (architecture doc, section A/J).
    balances: {
      ve: { type: Number, default: 0, min: 0 },
      sve: { type: Number, default: 0, min: 0 },
      token: { type: Number, default: 0, min: 0 },
    },
    // SHA-256 hash of the current refresh token, so a stolen DB dump can't be
    // replayed as a valid refresh token and a single token can be revoked on logout.
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
