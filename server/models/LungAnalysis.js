import mongoose from "mongoose";

const LungAnalysisSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  originalImage: { type: String, required: true }, // base64 string
  segmentedImage: { type: String }, // base64 string
  risk: { type: Number, required: true },
  status: { type: String, required: true },
  details: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("LungAnalysis", LungAnalysisSchema);
