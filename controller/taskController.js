const db = require("../db/db");

const newTask = async (req, res) => {
  const userId = res.locals.userId;
  const { title, difficulty, deadline, notes, categories } = req.body;

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

    //If there is a categories, it is an array, and the length is >0
    //1.Access the "categories" table
    //2.Look in the column name and mathc it to the given categories
    //3.Take the id of the matched names
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const categoriesId = await db("categories")
        .whereIn("name", categories)
        .pluck("id");

      //Loop through the found ids in categoriesId
      //Set task_id to the id of the newTask
      //Set catergory_id to the id from the categoriesId
      const categoryLinks = categoriesId.map((id) => ({
        task_id: newTask.id,
        category_id: id,
      }));

      //Then insert categoryLinks to the table "tasks_categories"
      if (categoryLinks.length > 0) {
        await db("tasks_categories").insert(categoryLinks);
      }
    }

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

    const categories = await db("tasks_categories")
      .join("categories", "tasks_categories.category_id", "categories.id")
      .where("tasks_categories.task_id", taskId)
      .select("categories.id", "categories.name", "categories.description");

    res.status(200).send({ data: { ...task, categories } });
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

const completeTask = async (req, res) => {
  const userId = res.locals.userId;
  const taskId = req.params.id;
  const { completed } = req.body;

  try {
    const task = await db("tasks")
      .where({
        id: taskId,
        user_id: userId,
      })
      .select();

    if (task.length === 0) {
      return res
        .status(404)
        .send({ message: `Task with ID ${taskId} not found` });
    }

    const updatedTask = await db("tasks")
      .where({
        id: taskId,
        user_id: userId,
      })
      .update({ completed });

    if (updatedTask) {
      res.status(200).send({ id: taskId, completed });
    } else {
      res.status(404).send({ message: "Task not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  newTask,
  getTask,
  getAllTasks,
  editTask,
  deleteTask,
  completeTask,
};
