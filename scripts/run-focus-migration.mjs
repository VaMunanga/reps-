import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error('Set DATABASE_URL_UNPOOLED to the intended database in this process.');
const sql = neon(url);
try {
  const migration = await readFile(new URL('../database/migrations/002_focus_groups.sql', import.meta.url), 'utf8');
  // This migration contains only DDL with no procedural bodies or quoted semicolons.
  const statements = migration.split(';').map(statement => statement.trim()).filter(statement => statement && !/^(BEGIN|COMMIT)$/i.test(statement));
  await sql.transaction(statements.map(statement => sql.query(statement)));
  const tables = await sql.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'focus_%'");
  if (tables.length !== 13) throw new Error('Unexpected Focus schema table count.');
  console.log('PASS: Focus additive migration and 13 table schema check');
} catch (error) {
  const message = String(error.message).replace(/postgres(?:ql)?:\/\/\S+/gi, '<redacted connection>');
  throw new Error(`Focus migration failed (${error.code ?? 'connection'}): ${message}`);
}
