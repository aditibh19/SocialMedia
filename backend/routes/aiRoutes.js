
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

router.post("/chat", auth, async (req, res) => {
  const prompt = req.body?.message;

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > 2000
  ) {
    return res.status(400).json({
      message: "Message must be 1-2000 characters"
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: "Gemini is not configured"
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt.trim() }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 2048
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      console.error("Gemini HTTP status:", response.status);

      return res.status(502).json({
        message: "AI service unavailable"
      });
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];

    const reply = candidate?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    const finishReason = candidate?.finishReason;

    if (!reply) {
      console.error("Gemini finish reason:", finishReason);

      return res.status(502).json({
        message: "AI returned no text"
      });
    }

    if (finishReason === "MAX_TOKENS") {
      console.warn("Gemini response reached token limit");
    }

    return res.status(200).json({
      reply,
      finishReason: finishReason || "UNKNOWN",
      truncated: finishReason === "MAX_TOKENS"
    });

  } catch (error) {
    console.error("Gemini request failed:", error.message);

    return res.status(502).json({
      message: "AI service unavailable"
    });
  }
});

module.exports = router;
