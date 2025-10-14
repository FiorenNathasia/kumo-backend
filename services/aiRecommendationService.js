const { combinedMoods } = require("../util/moodRulesLogic.js");
const { aiRecommendation } = require("../util/aiRecommendation.js");
const chatgpt = require("../util/openai.js");

async function generateAIRecommendation({
  entry,
  entryMoods,
  userTasks,
  allTaskCategories,
}) {
  //Go through entryMoods and get the meaning for each mood
  const selectedMoods = entryMoods.map((m) => m.meaning);

  //Pass through selectedMoods to combineMoods function
  const combined = combinedMoods(selectedMoods);

  //Pass through combined to aiRecommendation funtion
  const recommendationData = aiRecommendation(combined);

  //Pass through recommendationData, taskCategories, moods, and newEntry to chatgpt function
  const chatgptRecommendations = await chatgpt({
    recommendationData,
    allTaskCategories,
    moods: selectedMoods,
    entry: entry.journal,
    userTasks,
  });

  //Get all the ids of the tasks being returned from chatpgtRecommendations
  const suggestedTasksId = chatgptRecommendations.tasks.map((task) => task.id);

  //Get all the ids of the task of the current user
  const realTasksId = userTasks.map((task) => {
    return task.id;
  });

  //Filter out the ids of tasks from suggestedTasksId that does not exist in the ids of the current user's tasks
  const existingIds = suggestedTasksId.filter((id) => realTasksId.includes(id));

  //Use the ids from existingIds to filter out tasks that ai might have made up
  const chatgptTasks = chatgptRecommendations.tasks.filter((task) =>
    existingIds.includes(task.id)
  );
  return { ...chatgptRecommendations, tasks: chatgptTasks };
}

module.exports = { generateAIRecommendation };
