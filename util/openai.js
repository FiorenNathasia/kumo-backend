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

  const now = new Date();
  const soonThresehold = 3 * 24 * 60 * 60 * 1000;
  const taskWithUrgency = userTasks.map((task) => {
    const deadLine = new Date(task.deadline);
    return {
      ...task,
      isDueSoon: deadLine - now <= soonThresehold, // true if overdue or due soon
    };
  });

  const userPrompt = `Return ONLY tasks from this exact list: ${JSON.stringify(
    taskWithUrgency
  )}. 
Never create new tasks. 
Always include 1–2 tasks if at least one matches. 
Return them in the same format as shown.

Rules:
1. Always include ALL tasks where "isDueSoon": true, regardless of mood or difficulty. 
   These are mandatory and cannot be excluded.
2. After including all due-soon tasks, fill remaining slots (up to ${
    recommendationData.taskCount
  }) based on "${recommendationData.difficulty}".
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
8. Include an encouraging message with the given ${tone} 
9. Prioritize tasks where "isDueSoon": true if they fit other rules.
10. Always return tasks in the exact format provided (do NOT include the "isDueSoon" field).
If no tasks match, return:
{ "success": true, "message": "I couldn't find any suitable tasks right now, but take care of yourself.", "tasks": []`;

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
Weave in mood, journal entry, and tone naturally.
Prioritize tasks that are due soon if possible.

Output format must ALWAYS be valid JSON like this:
{
  "success": true,
  "message": "<Encouraging personal message that acknowledges the user's mood or entry, reflects the tone, and starts with 'I recommend doing these tasks...'>",
  "tasks": [ ...tasks from usersTasks... ]
}
Rules:
- Make the message warm, personal, and encouraging.
- Use the user's moods and journal entry if provided.
- Weave in the tone naturally (e.g. 'calm and soothing', 'upbeat and energetic').
- Always return 1–2 tasks if possible.
- Prioritize tasks where "isDueSoon": true if they fit other rules.
- If no tasks match, return:
  { "success": true, "message": "I couldn't find any suitable tasks right now, but take care of yourself.", "tasks": [] }`,
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
    const reply = JSON.parse(response.data.choices[0].message.content);
    console.log(reply);
    if (!reply.tasks || !Array.isArray(reply.tasks)) {
      reply.tasks = [];
    }

    const dueSoonTasks = userTasks.filter(
      (t) => new Date(t.deadline) - now <= soonThresehold
    );
    for (const task of dueSoonTasks) {
      if (!reply.tasks.some((t) => t.id === task.id)) {
        reply.tasks.push(task);
      }
    }
    reply.tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    console.log("Final reply:", reply);
    return reply;
  } catch (error) {
    console.error("GPT request failed:", error.response?.data || error.message);
    return { success: false, tasks: [] };
  }
}

module.exports = chatgpt;
