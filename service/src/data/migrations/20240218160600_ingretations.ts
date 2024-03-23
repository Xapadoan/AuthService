import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema
    .createTable('integrations', (table) => {
      table.bigIncrements('id', { primaryKey: true }).unsigned();
      table.string('apiKey').notNullable();
      table.string('registerWebhook').notNullable();
      table.string('restoreWebhook').notNullable();
      table.string('resetConfirmationWebhook').notNullable();
      table.string('resetCredentialsWebhook').notNullable();
      table.dateTime('createdAt').notNullable().defaultTo(knex.raw('NOW()'));
      table.dateTime('updatedAt').notNullable().defaultTo(knex.raw('NOW()'));
    })
    .createTable('users', (table) => {
      table.bigIncrements('id', { primaryKey: true }).unsigned();
      table
        .bigInteger('integrationId')
        .unsigned()
        .notNullable()
        .index()
        .references('id')
        .inTable('integrations')
        .onDelete('cascade');
      table.string('cardId').notNullable();
      table.string('email').notNullable();
      table.dateTime('createdAt').notNullable().defaultTo(knex.raw('NOW()'));
      table.dateTime('updatedAt').notNullable().defaultTo(knex.raw('NOW()'));
    });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('users');
  await knex.schema.dropTable('integrations');
}
