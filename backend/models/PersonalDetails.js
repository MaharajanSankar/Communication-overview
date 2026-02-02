const mongoose = require('mongoose');

const personalDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Identity & Basic Info
    FOA: {
      type: String,
      enum: ['Mr', 'Mrs'],
      required: true,
    },
    citizen: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    certName: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ['Married', 'Single'],
      required: true,
    },
    marriageDate: {
      type: Date,
    },
    // Origin & Documents
    nationality: {
      type: String,
      required: true,
    },
    countryBirth: {
      type: String,
      required: true,
    },
    stateBirth: {
      type: String,
      required: true,
    },
    cityBirth: {
      type: String,
      trim: true,
    },
    dualCitizenship: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    // Documents
    documents: {
      idDocument: {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
      },
      marksheet: {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
      },
    },
    // Completion status
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PersonalDetails', personalDetailsSchema);
