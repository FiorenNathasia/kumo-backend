const db = require("../db/db");

//POST new journal entry
const newJournal = async (req, res) => {
  const { text, date } = req.body;
  const userId = res.locals.userId;

  try {
    const today = new Date().toISOString().split("T")[0];

    const newJournal = await db("daily_entries")
      .insert({
        user_id: userId,
        date: today,
        journal: text,
      })
      .returning("*");

    const journal = newJournal[0];
    res.status(200).send({ data: journal });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error adding journal" });
  }
};

module.exports = {
  newJournal,
};
