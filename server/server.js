import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { exec } from "child_process";

// Models
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import LungAnalysis from "./models/LungAnalysis.js";

// Load Environment Variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// MongoDB connection
if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err.message);
    console.warn("Please ensure your database password in MONGODB_URI in .env is correct and IP Access is enabled on Atlas.");
  });

// --- API ROUTES ---

// 1. Sync / Save user health assessment answers & risk results
app.post("/api/users/sync", async (req, res) => {
  const { userId, answers, results } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { answers, results, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    console.error("Failed to sync user data:", error);
    res.status(500).json({ error: "Failed to sync user data" });
  }
});

// 2. Fetch user health assessment answers & risk results
app.get("/api/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User profile not found in cloud." });
    }
    res.json({ answers: user.answers, results: user.results });
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// 3. Sync / Save voice chat history messages
app.post("/api/conversations/sync", async (req, res) => {
  const { userId, messages } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { userId },
      { messages, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, conversation });
  } catch (error) {
    console.error("Failed to sync voice messages:", error);
    res.status(500).json({ error: "Failed to sync voice messages" });
  }
});

// 4. Fetch voice chat history messages
app.get("/api/conversations/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found in cloud." });
    }
    res.json({ messages: conversation.messages });
  } catch (error) {
    console.error("Failed to fetch voice messages:", error);
    res.status(500).json({ error: "Failed to fetch voice messages" });
  }
});

// 5. CT Lung Cancer AI Analysis (Watershed + VGG16)
app.post("/api/lung/analyze", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Image data is required" });
  }

  // Generate unique filename for temporary storage
  const tempId = Date.now() + "_" + Math.floor(Math.random() * 1000);
  const tempFileName = `temp_ct_${tempId}.png`;
  const tempFilePath = path.join(__dirname, tempFileName);

  try {
    // Strip Base64 header and write file
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    await fs.promises.writeFile(tempFilePath, base64Data, "base64");

    // Path to the python analysis script
    const scriptPath = path.join(__dirname, "lung_analysis.py");

    // Execute Python script
    exec(`python3 "${scriptPath}" "${tempFilePath}"`, (error, stdout, stderr) => {
      // Clean up the temp file immediately
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });

      if (error) {
        console.error("Python Execution Error:", error);
        console.error("Python Stderr:", stderr);
        return res.status(500).json({ error: "AI model execution failed." });
      }

      try {
        const results = JSON.parse(stdout);
        if (results.error) {
          return res.status(500).json({ error: results.error });
        }
        res.json(results);
      } catch (parseError) {
        console.error("Failed to parse Python stdout:", stdout);
        res.status(500).json({ error: "Failed to parse AI analysis results." });
      }
    });
  } catch (err) {
    console.error("Image processing error:", err);
    // Cleanup if file was written
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    res.status(500).json({ error: "Failed to save or process input image." });
  }
});

// 6. Sync Lung Analysis scan & results to MongoDB Atlas
app.post("/api/lung/sync", async (req, res) => {
  const { userId, originalImage, segmentedImage, risk, status, details } = req.body;

  if (!userId || !originalImage || risk === undefined || !status) {
    return res.status(400).json({ error: "Missing required fields for syncing lung analysis" });
  }

  try {
    const record = new LungAnalysis({
      userId,
      originalImage,
      segmentedImage,
      risk,
      status,
      details,
      createdAt: new Date()
    });

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    console.error("Failed to sync lung analysis to database:", error);
    res.status(500).json({ error: "Failed to sync lung analysis" });
  }
});

// 7. Get Lung Analysis scan history from MongoDB Atlas
app.get("/api/lung/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Return history sorted from newest to oldest
    const history = await LungAnalysis.find({ userId }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    console.error("Failed to fetch lung analysis history:", error);
    res.status(500).json({ error: "Failed to fetch lung analysis history" });
  }
});

// Basic Health Check Route
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express Backend Server is running on port ${PORT}`);
});
