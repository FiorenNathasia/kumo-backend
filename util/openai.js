const axios = require("axios");
const openAiKey = process.env.OPEN_AI_KEY;

const energyToneMapping = {
  1: "calming, soothing, low-energy",
  2: "neutral, balanced, moderate=energy",
  3: "upbeat, energtic, high-energy",
};

async function chatgpt(recommendationData, taskCategories, moods, entry) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openAiKey}`,
  };

  const avgEnergy = recommendationData?.avgEnergyLevel || 2;
  const tone =
    energyToneMapping[Math.round(avgEnergyLevel)] ||
    "neutral, balanced, moderate=energy";

  const userPrompt = `You are a task recommendation assistant. Generate a JSON onject ONLY with this structure:
    {
    "success": true,
    "tasks": [
        {
        "task": "<task text reflecting tone>", 
        "category": "<category>",
        "urgency": "<low|medium|high>",
        "tone": "<tone>",
        "icon": "<icon name>",
        "color": "<hex color code>"
        }
      ]
    }

    Requirements:
  1. Use the following user task categories: ${JSON.stringify(taskCategories)}.
2. Use the user's moods: ${JSON.stringify(moods)}.
3. Apply the tone: ${tone} to the text of each task.
4. Use entry text if provided: "${entry}".
5. Always return valid JSON only.
    `;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that only responds in valid JSON and styles the text based on the provided tone.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      },
      { headers }
    );
    const reply = response.data.choices[0].message.content;
    return JSON.parse(reply);
  } catch (error) {
    console.error("GPT request failed:", error.response?.data || error.message);
    return { success: false, tasks: [] };
  }
}
