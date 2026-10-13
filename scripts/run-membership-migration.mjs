import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
const migrationPath = process.argv[2];
if (!connectionString || !migrationPath) throw new Error("A direct database URL and migration path are required.");
const sql = neon(connectionString);
const verificationEmail = "release-test+schema@reps.invalid";
try {
  await sql.query(await readFile(migrationPath, "utf8"));
  const columns = await sql.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'membership_interests'
    ORDER BY ordinal_position
  `);
  const actual = columns.map((row) => row.column_name);
  const expected = ["id", "full_name", "email", "telephone", "programme", "academic_year", "interests", "goal", "working_time", "message", "consent", "submitted_at"];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Membership schema does not match the migration contract.");

  const values = ["REPS release test", verificationEmail, null, "Computer Science", 3, ["study"], "First goal", "Evening", null, true];
  const upsert = `
    INSERT INTO membership_interests
      (full_name, email, telephone, programme, academic_year, interests, goal, working_time, message, consent)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (email) DO UPDATE SET goal = EXCLUDED.goal, submitted_at = NOW()
    RETURNING id, goal
  `;
  const first = await sql.query(upsert, values);
  values[6] = "Updated goal";
  const second = await sql.query(upsert, values);
  if (first[0].id !== second[0].id || second[0].goal !== "Updated goal") throw new Error("Membership upsert verification failed.");
  console.log("Migration and schema verification: PASS");
} catch (error) {
  throw error;
} finally {
  await sql.query("DELETE FROM membership_interests WHERE email = $1", [verificationEmail]);
}
