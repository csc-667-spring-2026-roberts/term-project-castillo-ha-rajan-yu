import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

// Intentionally left blank as a scaffold migration.
export async function up(_pgm: MigrationBuilder): Promise<void> {}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
