/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tasks_categories", (table) => {
    table
      .integer("task_id")
      .notNullable()
      .references("id")
      .inTable("tasks")
      .onDelete("CASCADE");
    table
      .integer("category_id")
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE");
    table.primary(["task_id", "category_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("tasks_categories");
};
