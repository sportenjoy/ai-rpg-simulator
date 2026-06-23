import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Claude client with API key from environment
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main API endpoint for game messages
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system, model = "claude-sonnet-4-6" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    if (!system) {
      return res.status(400).json({ error: "Missing system prompt" });
    }

    // Call Claude API
    const response = await client.messages.create({
      model: model,
      max_tokens: 1000,
      system: system,
      messages: messages,
    });

    // Extract text content
    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    res.json({
      content: textContent,
      stop_reason: response.stop_reason,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    // Handle specific API errors
    if (error.status === 401) {
      return res.status(401).json({
        error: "Authentication failed - invalid API key",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limited - please try again later",
      });
    }

    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 萬界模擬器 API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
