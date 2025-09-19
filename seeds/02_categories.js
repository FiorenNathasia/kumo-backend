/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("categories").del();
  await knex("categories").insert([
    {
      name: "Focus",
      description:
        "Tasks requiring concentration or mental effort (writing, studying, planning)",
    },
    {
      name: "Move",
      description:
        "Physical activity or movement tasks (exercise, walking, chores)",
    },
    {
      name: "Create",
      description:
        "Creative or hands-on tasks (drawing, coding, music, DIY projects)",
    },
    {
      name: "Connect",
      description: "Social tasks (call/text friends, meetings, collaboration)",
    },
    {
      name: "Organize",
      description: "Tidying, planning, scheduling, decluttering",
    },
    {
      name: "Urgent",
      description: "Time-sensitive tasks (deadlines, bills, appointments)",
    },
    {
      name: "Fun",
      description:
        "Entertainment, hobbies, or enjoyable activities (games, hobbies)",
    },
    {
      name: "Reflect",
      description: "Journaling, self-improvement, goal review",
    },
  ]);
};
