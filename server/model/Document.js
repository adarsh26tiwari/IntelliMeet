import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    vectorIds: {
      type: [String],
      default: [],
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processingError: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,    // ← NEW — Cloudinary URL
      default: null,
    },
    cloudinaryPublicId: {
      type: String,    // ← NEW — delete ke liye
      default: null,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;