const db = require("../db/db");

async function getUserTasksWithCategories(userId) {
  //Get all the task for current user
  const userTasks = await db("tasks").where({ user_id: userId }).select();

  let allTaskCategories = [];
  //Loop through al the task for current user
  for (const task of userTasks) {
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

  return { userTasks, allTaskCategories };
}

module.exports = { getUserTasksWithCategories };
