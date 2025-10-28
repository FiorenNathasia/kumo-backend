const db = require("../db/db");
const { createJournalEntry } = require("../services/journalService");
const { getUserTasksWithCategories } = require("../services/taskService");
const {
  generateAIRecommendation,
} = require("../services/aiRecommendationService");

//POST new journal entry
const newEntry = async (req, res) => {
  const userId = res.locals.userId;
  const { text, moods } = req.body;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const exist = await db("ai_recommendations")
      .where({
        user_id: userId,
      })
      .andWhere("created_at", ">=", startOfDay)
      .andWhere("created_at", "<=", endOfDay)
      .first();

    if (exist) {
      return res.status(409).json({ message: "Mood already submitted today" });
    }
    //Pass the userId, text, moods to createJournalEntry() to produce the entry and entryMoods
    const { entry, entryMoods } = await createJournalEntry(userId, text, moods);
    //Pass the userId to getUserTasks and task and categories links which is allTaskCategories
    const { userTasks, allTaskCategories } = await getUserTasksWithCategories(
      userId
    );

    //Pass entry, entryMoods, userTasks, allTaskCAtegories to generate ai recommedations to generateAiRecommendation
    const finalChatgptRecommendation = await generateAIRecommendation({
      entry,
      entryMoods,
      userTasks,
      allTaskCategories,
    });

    //Insert the results of finalChatgptRecommendation into db (ai_recommendation)
    //1. Set the user_id in the table with the current userId
    //2. Set the daily_entry_id with the id of the current entry
    //3. Get the success status from finalChatgptRecommendation and put it in the coresponding column
    //4. Get the message from finalChatgptRecommendation and put it in the coresponding column
    //5. Get the tone  value from finalChatgptRecommendation and put it in the coresponding column
    //6. Get the energy_level value from finalChatgptRecommendation and put it in the coresponding column
    //7. Put in the full JSON response into the raw_response column
    const [aiRecommendation] = await db("ai_recommendations")
      .insert({
        user_id: userId,
        daily_entry_id: entry.id,
        success: finalChatgptRecommendation.success,
        message: finalChatgptRecommendation.message,
        tone: finalChatgptRecommendation.tone,
        energy_level: finalChatgptRecommendation.energyLevel,
        raw_response: finalChatgptRecommendation,
      })
      .returning("*");

    //Create the link from the userTasks that correspond to the tasks from the finalChatgptRecommendation
    //1. Map through the tasks in finalChatgptRecommendation
    //2. Assign the recommendation_id to the corresponding task_id in finalChatgptRecommendation
    const recommendedTaskLinks = finalChatgptRecommendation.tasks.map(
      (task) => ({
        recommendation_id: aiRecommendation.id,
        task_id: task.id,
      })
    );

    //If there are more than 0 recommendedTaskLinks
    //Access the ai_recommended_tasks table and insert the links
    if (recommendedTaskLinks.length > 0) {
      await db("ai_recommended_tasks").insert(recommendedTaskLinks);
    }

    res.status(200).send({
      message:
        "Journal entry created and AI recommendations linked successfully.",
      journalEntryId: entry.id,
      recommendationId: aiRecommendation.id,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error adding journal" });
  }
};

const getRecommendation = async (req, res) => {
  const userId = res.locals.userId;
  const entryId = req.params.id;

  try {
    //From the ai_recommendations table with the current user_id & daily_entry_id
    //And get the first match id, success status, message, tone, and energy_level
    const recommendation = await db("ai_recommendations")
      .where({
        user_id: userId,
        daily_entry_id: entryId,
      })
      .select("id", "success", "message", "tone", "energy_level")
      .first();

    //In the ai_recommended_tasks...
    //Join the id of tasks in tasks table with the task_id in the ai_recommended_tasks
    //And where the recommendation id from above with the recommendation_id in the ai_recommended_tasks table
    //And select the id, title, difficulty, and notes of the tasks and the completed status and created_at from ai_recommended_tasks
    //This is the how to get the list of tasks from the ai recommendation made fro, the current entry
    const tasks = await db("ai_recommended_tasks")
      .join("tasks", "ai_recommended_tasks.task_id", "tasks.id")
      .where("ai_recommended_tasks.recommendation_id", recommendation.id)
      .select(
        "tasks.id",
        "tasks.title",
        "tasks.difficulty",
        "tasks.deadline",
        "tasks.notes",
        "tasks.completed",
        "ai_recommended_tasks.created_at"
      );

    res.status(200).send({
      recommendation,
      tasks,
    });
  } catch (error) {
    return res
      .status(400)
      .send({ message: "Error getting ai recommendations" });
  }
};

const getAllRecommendation = async (req, res) => {};

const getEntry = async (req, res) => {
  const userId = res.locals.userId;
  const entryId = req.params.id;
  try {
    const entry = await db("daily_entries")
      .where({
        id: entryId,
        user_id: userId,
      })
      .select()
      .first();

    //Get the emojis and the meaning of them
    //First access the daily_entry_moods table
    const entryMoods = await db("daily_entry_moods")
      //1.Join the moods table + the mood_id collum in daily_entry_moods, and the id collumn in mood table
      //2.Look in daily_entry_id collumn and match with current entry id
      //3.Get the asscosciated emojis and meaning for that newJournal entry
      .join("moods", "daily_entry_moods.mood_id", "moods.id")
      .where("daily_entry_moods.daily_entry_id", entry.id)
      .select("moods.emojis", "moods.meaning");

    res.status(200).send({ data: entry, mood: entryMoods });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error getting journal" });
  }
};

const getEntries = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const entries = await db("daily_entries")
      .where({
        user_id: userId,
      })
      .orderBy("date", "desc")
      .select("*");

    const entriesIds = entries.map((e) => e.id);

    //Get the emojis and the meaning of them
    //First access the daily_entry_moods table
    const entryMoods = await db("daily_entry_moods")
      //1.Join the moods table + the mood_id collum in daily_entry_moods, and the id collumn in mood table
      //2.Look in daily_entry_id collumn and match with current newJournal's id
      //3.Get the asscosciated daily_entry_id, emojis and meaning for that newJournal entry
      .join("moods", "daily_entry_moods.mood_id", "moods.id")
      .whereIn("daily_entry_moods.daily_entry_id", entriesIds)
      .select(
        "daily_entry_moods.daily_entry_id",
        "moods.emojis",
        "moods.meaning"
      );

    // Go through each journal entry
    const entryWithMoods = entries.map((entry) => ({
      ...entry,
      // For this entry, find all moods in entryMoods that match its id
      moods: entryMoods
        .filter((m) => m.daily_entry_id === entry.id)
        // From those moods, keep only the emoji and meaning fields
        .map((m) => ({ emojis: m.emojis, meaning: m.meaning })),
    }));

    res.status(400).send({ data: entryWithMoods });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error getting journals" });
  }
};

const editEntry = async (req, res) => {
  const userId = res.locals.userId;
  const entryId = req.params.id;
  const { text, addMoods = [], removeMoods = [] } = req.body;

  try {
    let entry = await db("daily_entries")
      .where({ id: entryId, user_id: userId })
      .first();

    // If the user provided new text for the entry
    if (text !== undefined) {
      // Update the entry text and timestamp in the daily_entries table
      await db("daily_entries")
        .where({ id: entryId, user_id: userId })
        .update({ journal: text });
    }

    //If the user want to remove moods
    if (removeMoods.length > 0) {
      //Access the daily_entry_moods table
      await db("daily_entry_moods")
        // Delete rows from the join table where entry matches and mood_id is in removeMoods
        .where({ daily_entry_id: entryId })
        .whereIn("mood_id", removeMoods)
        .del();
    }

    // For each mood the user wants to add
    for (const moodId of addMoods) {
      // Check if this entry already has that mood
      const exists = await db("daily_entry_moods")
        .where({
          daily_entry_id: entryId,
          mood_id: moodId,
        })
        .first();

      // If not, insert a new row linking the entry to the mood
      if (!exists) {
        await db("daily_entry_moods").insert({
          daily_entry_id: entryId,
          mood_id: moodId,
        });
      }
    }
    res.status(200).send({ message: "Journal updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error editing journal" });
  }
};

module.exports = {
  newEntry,
  getRecommendation,
  getAllRecommendation,
  getEntry,
  getEntries,
  editEntry,
};
