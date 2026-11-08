import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('players',{id:text('id').primaryKey(),alias:text('alias').notNull(),createdAt:integer('created_at').notNull()});
export const scores=sqliteTable('scores',{player:text('player').notNull().references(()=>players.id),level:integer('level').notNull(),moves:integer('moves').notNull(),points:integer('points').notNull(),updatedAt:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.player,t.level]})]);
