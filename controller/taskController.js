const db = require("../db/db");

const newTask = async (req, res) => {
  const userId = res.locals.userId;
  const { title, difficulty, deadline, notes } = req.body;

  try {
    const [newTask] = await db("tasks")
      .insert({
        user_id: userId,
        title,
        difficulty,
        deadline,
        notes,
      })
      .returning("*");

    res.status(201).send({ data: newTask });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Error adding task" });
  }
};

const getTask = async (req, res) => {
  const userId = res.locals.userId;
  const taskId = req.params.id;

  try {
    const task = await db("tasks")
      .where({ id: taskId, user_id: userId })
      .select()
      .first();
    res.status(200).send({ data: task });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error getting task" });
  }
};

const getAllTasks = async (req, res) => {
  const userId = res.locals.userId;

  try {
    const tasks = await db("tasks")
      .where({
        user_id: userId,
      })
      .select();

    res.status(200).send({ data: tasks });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error getting tasks" });
  }
};

const editTask = async (req, res) => {
  const userId = res.locals.userId;
  const taskId = req.params.id;
  const { title, difficulty, deadline, notes } = req.body;

  try {
    let task = await db("tasks").where({ id: taskId, user_id: userId }).first();

    await db("tasks")
      .where({ id: taskId, user_id: userId })
      .update({ title, difficulty, deadline, notes });
    res.status(200).send({ data: task });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error editing task" });
  }
};

const deleteTask = async (req, res) => {
  const userId = res.locals.userId;
  const taskId = req.params.id;

  await db("tasks").where({ id: taskId, user_id: userId }).select().del();
  res.status(200).send({ message: "Task succesfully deleted!" });
  try {
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error deleting task" });
  }
};

module.exports = {
  newTask,
  getTask,
  getAllTasks,
  editTask,
  deleteTask,
};
