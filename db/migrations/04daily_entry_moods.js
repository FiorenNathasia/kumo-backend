/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("daily_entry_moods", (table) => {
    table
      .integer("daily_entry_id")
      .notNullable()
      .references("id")
      .inTable("daily_entries")
      .onDelete("CASCADE");
    table
      .integer("mood_id")
      .notNullable()
      .references("id")
      .inTable("moods")
      .onDelete("CASCADE");
    table.primary(["daily_entry_id", "mood_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("daily_entry_moods");
};
