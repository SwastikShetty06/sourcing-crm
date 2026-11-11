const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['site_visit', 'revisit', 'call', 'vc', 'obm', 'other'],
      default: 'site_visit',
      required: true
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    salesManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup',
      required: true
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['in_progress', 'booked', 'lost'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  {
    _id: false
  }
);

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    clientPhone: {
      type: String,
      trim: true,
      match: /^[0-9]{10}$/
    },
    projectName: {
      type: String,
      trim: true,
      maxlength: 80
    },
    leadSource: {
      type: String,
      enum: ['calling', 'reference'],
      required: true
    },
    cpFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup',
      required: true
    },
    cp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup',
      required: true
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup',
      default: null
    },
    firstVisitDate: {
      type: Date,
      default: Date.now
    },
    interactions: [interactionSchema],
    lastInteractionAt: {
      type: Date
    },
    lastSalesManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup'
    },
    status: {
      type: String,
      enum: ['in_progress', 'booked', 'lost'],
      default: 'in_progress'
    },
    statusHistory: [statusHistorySchema],
    lostReason: {
      type: String,
      enum: ['budget', 'location', 'chose_competitor', 'not_interested', 'unreachable', 'other']
    },
    lostNote: {
      type: String,
      trim: true,
      maxlength: 300
    },
    unitDetails: {
      type: String,
      trim: true,
      maxlength: 80
    },
    bookingDate: {
      type: Date
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

clientSchema.pre('save', function (next) {
  if (this.interactions && this.interactions.length > 0) {
    const sorted = [...this.interactions].sort(
      (a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)
    );
    this.lastInteractionAt = sorted[0].occurredAt;
    this.lastSalesManager = sorted[0].salesManager;
  }
  next();
});

clientSchema.index({ status: 1 });
clientSchema.index({ cp: 1 });
clientSchema.index({ cpFirm: 1 });
clientSchema.index({ caller: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ lastInteractionAt: -1 });
clientSchema.index({ clientName: 1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
