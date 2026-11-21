
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

async function generateChecklistSuggestions(clientDetails, existingTasks) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const prompt = `
You are an assistant for an accounting firm.

Suggest useful document collection checklist tasks based on
the following non-identifying client information.

Client business type: ${clientDetails.businessType || "Not provided"}
Client status: ${clientDetails.status || "Not provided"}

Existing checklist tasks:
${existingTasks.length
    ? existingTasks.map((task) => `- ${task.title}`).join("\n")
    : "No existing tasks"}

Rules:
1. Suggest 3 to 5 relevant checklist tasks.
2. Do not repeat existing tasks.
3. Do not invent client information.
4. Return only valid JSON.
5. Each task must have title, description and category.
6. Use simple, professional language.

Expected JSON:
{
  "suggestions": [
    {
      "title": "Collect bank statement",
      "description": "Request the latest bank statement.",
      "category": "Financial"
    }
  ]
}
`;

  const requestOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  }),
};

let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  response = await fetch(
    `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    requestOptions
  );

  if (response.ok) break;

  const retryable = [429, 500, 502, 503, 504].includes(response.status);

  if (!retryable || attempt === 3) break;

  const delay = 2000 * Math.pow(2, attempt - 1);

  console.log(`Gemini temporary error. Retrying in ${delay / 1000}s...`);

  await new Promise(resolve => setTimeout(resolve, delay));
}

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API error:", response.status, errorData);

    throw new Error("AI checklist suggestions are temporarily unavailable.");
  }

  const data = await response.json();

  const generatedText =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("AI returned an empty response.");
  }

  const parsed = JSON.parse(generatedText);

  if (!Array.isArray(parsed.suggestions)) {
    throw new Error("AI returned an invalid checklist format.");
  }

  return parsed.suggestions
    .filter(
      (task) =>
        typeof task.title === "string" &&
        typeof task.description === "string" &&
        typeof task.category === "string"
    )
    .slice(0, 5)
    .map((task) => ({
      title: task.title.trim().slice(0, 150),
      description: task.description.trim().slice(0, 500),
      category: task.category.trim().slice(0, 50),
    }))
    .filter(
      (task) => task.title && task.description && task.category
    );
}

module.exports = { generateChecklistSuggestions };
