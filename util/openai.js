const axios = require("axios");
const openAiKey = process.env.OPEN_AI_KEY;

const energyToneMapping = {
  1: "calming, soothing, low-energy",
  2: "neutral, balanced, moderate-energy",
  3: "upbeat, energtic, high-energy",
};

async function chatgpt({
  recommendationData,
  allTaskCategories,
  moods,
  entry = " ",
  userTasks,
}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openAiKey}`,
  };

  const avgEnergy = recommendationData?.avgEnergyLevel || 2;
  const tone =
    energyToneMapping[Math.round(avgEnergy)] ||
    "neutral, balanced, moderate=energy";

  const userPrompt = `Return ONLY tasks from this exact list: ${JSON.stringify(
    userTasks
  )}. 
Never create new tasks. 
Always include 1–2 tasks if at least one matches. 
Return them in the same format as shown.

Rules:
1. Select up to ${recommendationData.taskCount} tasks.
2. Only include tasks with difficulty "${recommendationData.difficulty}".
3. Consider avgEnergyLevel = ${
    recommendationData.avgEnergyLevel
  } → tone = "${tone}".
4. Prioritize categories from sortedCat: ${JSON.stringify(
    recommendationData.sortedCat
  )}.
5. Match task categories from allTaskCategories: ${JSON.stringify(
    allTaskCategories
  )}.
6. Consider moods: ${JSON.stringify(moods)}.
7. Journal entry: "${entry}".
    `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a strict task recommender. 
You must ONLY return tasks from the provided "usersTasks" list.
You are NOT allowed to create or invent new tasks. 
Always return 1–2 tasks if possible. 
Only return {"success": true, "tasks": []} if literally no tasks exist. 
Output must always be valid JSON.`,
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

module.exports = chatgpt;
