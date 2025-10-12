/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("ai_recommendations", (table) => {
    table.increments("id").primary();
    table.integer("user_id").references("id").inTable("users");
    table
      .integer("daily_entry_id")
      .unsigned()
      .references("id")
      .inTable("daily_entries")
      .onDelete("CASCADE");
    table.boolean("success").defaultTo(true);
    table.text("message");
    table.string("tone");
    table.integer("energy_level");
    table.jsonb("raw_response");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("ai_recommendations");
};
