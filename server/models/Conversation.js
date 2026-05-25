import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messages: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Conversation", ConversationSchema);
