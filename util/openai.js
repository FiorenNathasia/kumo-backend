const axios = require("axios");
const openAiKey = process.env.OPEN_AI_KEY;

//Create an object that determine the tone that will be used
//Should be based on the scale of the energy level to be compared to
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

  //Set the avgEnergyLevel from the passed recommendationData,
  //If it can't be retrieved, set it to the 2 (middle)
  const avgEnergy = recommendationData?.avgEnergyLevel || 2;

  //Set the tone by rounding the avgEnerfy to the nearest interger
  //Use the rounded avgEnergy and match it to the appropriate number from the energyToneMapping object
  //If this can't be done, set it to the "neutral" or middle tone
  const tone =
    energyToneMapping[Math.round(avgEnergy)] ||
    "neutral, balanced, moderate=energy";

  //Get the date for today
  const now = new Date();
  //This determines how far ahead the due date is (3days)
  const soonThresehold = 3 * 24 * 60 * 60 * 1000;
  //Map throught the current user's tasks
  //Get the deadline from each task
  //Add isDueSoon (truthy falsy) by subtracting the current date from the deadline
  //If it is less or equal to the set days is soonThresehold (3 days), set to true
  //Return the array of task object, that includes dueSoon in every task
  const taskWithUrgency = userTasks.map((task) => {
    const deadLine = new Date(task.deadline);
    return {
      ...task,
      isDueSoon: deadLine - now <= soonThresehold, // true if overdue or due soon
    };
  });

  //Write the userPrompt to be used for the Open AI call
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
    //Add the tone to the reply
    reply.tone = tone; // e.g., "calming, soothing, low-energy"
    //Add the energyLevel to the reply
    reply.energyLevel = avgEnergy;

    //If there are no tasks to the reply
    //Or the tasks in reply isn't an array
    //Add an empty array to the tasks key in the object
    if (!reply.tasks || !Array.isArray(reply.tasks)) {
      reply.tasks = [];
    }

    //Go through the userTasks and filter out the tasks that are due soon
    const dueSoonTasks = userTasks.filter(
      (t) => new Date(t.deadline) - now <= soonThresehold
    );

    //Loop through tasks in dueSoonTasks
    //If there is no match of the task from dueSoonTasks to the task in the reply
    //Push the task from the dueSoonTasks into the reply task array
    for (const task of dueSoonTasks) {
      if (!reply.tasks.some((t) => t.id === task.id)) {
        reply.tasks.push(task);
      }
    }

    //Go through the tasks in reply, sort the tasks by the clossest deadline
    reply.tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return reply;
  } catch (error) {
    console.error("GPT request failed:", error.response?.data || error.message);
    return { success: false, tasks: [] };
  }
}

module.exports = chatgpt;
