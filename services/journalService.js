const db = require("../db/db");

async function createJournalEntry(userId, text, moods) {
  const entryDate = new Date().toISOString().split("T")[0];
  const entryText = text || "";

  const [entry] = await db("daily_entries")
    .insert({
      user_id: userId,
      date: entryDate,
      journal: entryText,
    })
    .returning("*");

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
      daily_entry_id: entry.id,
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
    .where("daily_entry_moods.daily_entry_id", entry.id)
    .select("moods.emojis", "moods.meaning");

  return { entry, entryMoods };
}

module.exports = { createJournalEntry };
