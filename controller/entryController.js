const db = require("../db/db");

//POST new journal entry
const newEntry = async (req, res) => {
  const { text, moods } = req.body;
  const userId = res.locals.userId;

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

    const entryMoods = await db("daily_entry_moods")
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

    const entriesIds = entries.map((j) => j.id);

    const entryMoods = await db("daily_entry_moods")
      .join("moods", "daily_entry_moods.mood_id", "moods.id")
      .whereIn("daily_entry_moods.daily_entry_id", entriesIds)
      .select(
        "daily_entry_moods.daily_entry_id",
        "moods.emojis",
        "moods.meaning"
      );
    const entryWithMoods = entries.map((entry) => ({
      ...entry,
      moods: entryMoods
        .filter((m) => m.daily_entry_id === entry.id)
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
  const { text, moods } = req.body;

  try {
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
