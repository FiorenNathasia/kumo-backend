/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("ai_recommended_tasks", (table) => {
    table.increments("id").primary();
    table
      .integer("recommendation_id")
      .unsigned()
      .references("id")
      .inTable("ai_recommendations")
      .onDelete("CASCADE");
    table
      .integer("task_id")
      .unsigned()
      .references("id")
      .inTable("tasks")
      .onDelete("CASCADE");
    table.boolean("completed").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("ai_recommended_tasks");
};
