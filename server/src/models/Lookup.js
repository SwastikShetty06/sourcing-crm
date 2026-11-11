const mongoose = require('mongoose');
const { normalizeName, normalizeKey } = require('../utils/normalize');

const lookupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['cp_firm', 'cp', 'caller', 'sales_manager']
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    nameKey: {
      type: String,
      required: true,
      trim: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lookup',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    useCount: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date
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

lookupSchema.pre('validate', function (next) {
  if (this.name) {
    this.name = normalizeName(this.name);
    this.nameKey = normalizeKey(this.name);
  }
  if (this.type !== 'cp') {
    this.parentId = null;
  }
  next();
});

lookupSchema.index({ type: 1, nameKey: 1, parentId: 1, createdBy: 1 }, { unique: true });
lookupSchema.index({ createdBy: 1, type: 1, isActive: 1 });
lookupSchema.index({ createdBy: 1, parentId: 1 });

lookupSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

const Lookup = mongoose.model('Lookup', lookupSchema);

module.exports = Lookup;
