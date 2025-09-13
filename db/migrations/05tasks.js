/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tasks", (table) => {
    table.increments("id").primary;
    table.integer("user_id").references("id").inTable("users");
    table.string("title").notNullable();
    table.string("difficulty", 20);
    table.date("deadline");
    table.text("notes");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("texts");
};
