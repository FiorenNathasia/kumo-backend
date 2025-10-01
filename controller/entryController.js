const db = require("../db/db");
const { combinedMoods } = require("../util/moodRulesLogic.js");
const { aiRecommendation } = require("../util/aiRecommendation.js");
const chatgpt = require("../util/openai.js");

//POST new journal entry
const newEntry = async (req, res) => {
  const userId = res.locals.userId;
  const { text, moods } = req.body;
  try {
    const entryDate = new Date().toISOString().split("T")[0];
    const entryText = text || "";

    const [newEntry] = await db("daily_entries")
      .insert({
        user_id: userId,
        date: entryDate,
        journal: entryText,
      })
      .returning("*");

    let moodsLinks = [];
    //If there are content in moods req.body,
    //And moods is an array,
    //And the length of moods req.body is greater than 0
    if (moods && Array.isArray(moods) && moods.length > 0) {
      //Get the id of the inserted moods from moods table
      //And match the inserted moods to the emojis collumn form the moods table
      //Then take the id of the found matched emojis
      const moodsId = await db("moods").whereIn("emojis", moods).pluck("id");

      //Make a new variable
      //Where you then map through the moodsId array
      //You first set the id of the journal entry to the collum in the table(daily_entry_moods)
      //And then the id of the emojis that has been inserted for the collumn mood_id in the same table
      const moodLinks = moodsId.map((id) => ({
        daily_entry_id: newEntry.id,
        mood_id: id,
      }));

      //If there is content in the moodLinks
      if (moodLinks.length > 0) {
        //In the table daily_entry_moods, insert the content of moodLinks
        await db("daily_entry_moods").insert(moodLinks);
      }
    }

    //Get the emojis and the meaning of them
    //First access the daily_entry_moods table
    const entryMoods = await db("daily_entry_moods")
      //1.Join the moods table + the mood_id collum in daily_entry_moods, and the id collumn in mood table
      //2.Look in daily_entry_id collumn and match with current newJournal's id
      //3.Get the asscosciated emojis and meaning for that newJournal entry
      .join("moods", "daily_entry_moods.mood_id", "moods.id")
      .where("daily_entry_moods.daily_entry_id", newEntry.id)
      .select("moods.emojis", "moods.meaning");

    //Get all the task for current user
    const userTasks = await db("tasks").where({ user_id: userId }).select();
    console.log(userTasks);

    let allTaskCategories = [];
    //Loop through al the task for current user
    for (task of userTasks) {
      //1.Access the table tasks_categories table
      //2.Join the categories table + the category_id from tasks_categories table + id of the categories in categories table
      //3.Look into the task_id column and match with the ids of the current users task
      //4.Get the name and description of the categories for the current user's tasks
      const taskCategories = await db("tasks_categories")
        .join("categories", "tasks_categories.category_id", "categories.id")
        .where("tasks_categories.task_id", task.id)
        .select("categories.name", "categories.description");

      allTaskCategories.push({ taskId: task.id, categories: taskCategories });
    }

    //Go through entryMoods and get the meaning for each mood
    const selectedMoods = entryMoods.map((m) => m.meaning);

    //Pass through selectedMoods to combineMoods function
    const combined = combinedMoods(selectedMoods);

    //Pass through combined to aiRecommendation funtion
    const recommendationData = aiRecommendation(combined);

    //Pass through recommendationData, taskCategories, moods, and newEntry to chatgpt function
    const chatpgtRecommendations = await chatgpt({
      recommendationData,
      taskCategories: allTaskCategories,
      moods: selectedMoods,
      entry: newEntry.journal,
    });

    res.status(200).send({ data: { ...newEntry, moods: entryMoods } });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error adding journal" });
  }
};

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
  getEntry,
  getEntries,
  editEntry,
};
