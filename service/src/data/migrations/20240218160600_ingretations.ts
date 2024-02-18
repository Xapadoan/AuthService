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
      table.dateTime('created_at').notNullable().defaultTo(knex.raw('NOW()'));
    });
}
