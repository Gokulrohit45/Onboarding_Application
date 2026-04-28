const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Not required initially when created by admin
    },
    tempPassword: {
      type: String,
      required: true,
    },
    isTempPasswordExpired: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    faceData: {
      type: [Number], // Storing the 128-float descriptor
      default: null,
    },
    userId: {
      type: String,
      unique: true,
      required: true,
    },
    unionNumber: {
      type: String,
    },
    faceVerificationToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password/tempPassword before saving
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified('tempPassword')) {
    this.tempPassword = await bcrypt.hash(this.tempPassword, 10);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return false;
};

// Compare temp password method
userSchema.methods.matchTempPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.tempPassword);
};

module.exports = mongoose.model('User', userSchema);
