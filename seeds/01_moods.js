/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("moods").del();
  await knex("moods").insert([
    { emojis: "😢", meaning: "devastated" },
    { emojis: "😞", meaning: "sad" },
    { emojis: "😐", meaning: "neutral" },
    { emojis: "😆", meaning: "happy" },
    { emojis: "🤩", meaning: "enthusiastic" },
    { emojis: "🫣", meaning: "anxious" },
    { emojis: "😡", meaning: "frustrated" },
    { emojis: "🥱", meaning: "exhausted" },
    { emojis: "🤯", meaning: "stressed" },
    { emojis: "💆", meaning: "relaxed" },
  ]);
};
