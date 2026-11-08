import assert from 'node:assert/strict';
const base = process.env.FOCUS_TEST_URL;
if (!base) throw new Error('Set FOCUS_TEST_URL to the isolated PHP test server; never run against production.');
if (process.env.FOCUS_TEST_ISOLATED !== 'yes') throw new Error('Set FOCUS_TEST_ISOLATED=yes only for an isolated test database.');
class Client {
  cookie = ''; csrf = '';
  async call(action, body, status = 200) {
    const response = await fetch(`${base}?action=${action}`, {method: body ? 'POST' : 'GET', headers: {'Content-Type':'application/json', Cookie:this.cookie,'X-CSRF-Token':this.csrf}, body: body ? JSON.stringify(body) : undefined});
    const cookie = response.headers.get('set-cookie'); if (cookie) this.cookie = cookie.split(';')[0];
    const data = await response.json(); assert.equal(response.status,status,JSON.stringify(data));
    if (data.csrf) this.csrf = data.csrf;
    assert.ok(data.serverTime); return data;
  }
}
const a = new Client(), b = new Client(), outsider = new Client();
await Promise.all([a.call('bootstrap'),b.call('bootstrap'),outsider.call('bootstrap')]);
await a.call('group_create',{name:'No account',timezone:'UTC'},401);
const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
await a.call('register',{name:'Owner',email:`owner-${unique}@example.com`,password:'Very-long-test-password-7'});
await b.call('register',{name:'Member',email:`member-${unique}@example.com`,password:'Very-long-test-password-7'});
const {groupId} = await a.call('group_create',{name:'Integration group',timezone:'Africa/Johannesburg'});
await outsider.call(`group_view&groupId=${groupId}`,undefined,401);
await b.call(`group_view&groupId=${groupId}`,undefined,403);
const first = await a.call('invite_rotate',{groupId});
const second = await a.call('invite_rotate',{groupId});
await b.call('invite_join',{token:first.inviteToken},404);
await b.call('invite_join',{token:second.inviteToken});
await b.call('group_schedule',{groupId},403);
const schedule = await a.call('group_schedule',{groupId,task:'Shared task',startsAt:new Date(Date.now()+300000).toISOString(),focusMinutes:1,breakMinutes:1,rounds:1,saveTemplate:true});
let view = await b.call(`group_view&groupId=${groupId}`);
assert.equal(view.schedule.id,schedule.scheduleId); assert.equal(view.participants.length,1); assert.equal(view.leaderboard.length,0);
await a.call('participation',{groupId,scheduleId:schedule.scheduleId,operation:'join'});
await a.call('solo',{operation:'start',clientId:'conflict',durationMinutes:1},409);
await a.call('group_leave',{groupId},409);
await b.call('group_leave',{groupId});
await b.call(`group_view&groupId=${groupId}`,undefined,403);
await a.call('participation',{groupId,scheduleId:schedule.scheduleId,operation:'leave'});
const soloStarted = await a.call('solo',{operation:'start',clientId:'solo-test',durationMinutes:1});
assert.ok(Number.isFinite(Date.parse(soloStarted.deadline)), 'running solo response supplies authoritative deadline');
assert.equal(soloStarted.state,'running');
await a.call('solo',{operation:'heartbeat',clientId:'solo-test'});
await a.call('solo',{operation:'end',clientId:'solo-test'});
if (process.env.FOCUS_TEST_DATABASE_URL) {
  const {neon} = await import('@neondatabase/serverless');
  const sql = neon(process.env.FOCUS_TEST_DATABASE_URL);
  const account = (await a.call('bootstrap')).user.id;
  // Isolated fixture establishes already-confirmed history; HTTP confirms the final boundary.
  await a.call('solo',{operation:'start',clientId:'complete-fixture',durationMinutes:1});
  await sql`UPDATE focus_participation SET starts_at=now()-interval '61 seconds',solo_ends_at=now()-interval '1 second',last_confirmed=now()-interval '5 seconds' WHERE account_id=${account} AND client_id='complete-fixture'`;
  await sql`INSERT INTO focus_intervals(account_id,participation_id,starts_at,ends_at) SELECT account_id,id,starts_at,last_confirmed FROM focus_participation WHERE account_id=${account} AND client_id='complete-fixture'`;
  const completed = await a.call('solo',{operation:'heartbeat',clientId:'complete-fixture'});
  assert.equal(completed.totals.reps,1);
  const duplicate = await a.call('solo',{operation:'heartbeat',clientId:'complete-fixture'});
  assert.equal(duplicate.totals.reps,1); assert.equal(duplicate.totals.focusedMinutes,completed.totals.focusedMinutes);
  await a.call('solo',{operation:'end',clientId:'complete-fixture'});
  await a.call('solo',{operation:'start',clientId:'gap-fixture',durationMinutes:1});
  await sql`UPDATE focus_participation SET starts_at=now()-interval '61 seconds',solo_ends_at=now()-interval '1 second',last_confirmed=now()-interval '40 seconds' WHERE account_id=${account} AND client_id='gap-fixture'`;
  const gap = await a.call('solo',{operation:'heartbeat',clientId:'gap-fixture'});
  assert.deepEqual(gap.totals,completed.totals);
  await a.call('solo',{operation:'end',clientId:'gap-fixture'});
  // A different source cannot import time already assigned in the account ledger.
  await a.call('solo',{operation:'start',clientId:'overlap-fixture',durationMinutes:1});
  await sql`WITH old AS (SELECT id,solo_ends_at FROM focus_participation WHERE account_id=${account} AND client_id='complete-fixture'), shifted AS (UPDATE focus_intervals i SET starts_at=i.starts_at+(now()-interval '1 second'-old.solo_ends_at),ends_at=i.ends_at+(now()-interval '1 second'-old.solo_ends_at) FROM old WHERE i.participation_id=old.id RETURNING i.id) UPDATE focus_participation SET starts_at=now()-interval '61 seconds',solo_ends_at=now()-interval '1 second' WHERE account_id=${account} AND client_id='complete-fixture'`;
  await sql`UPDATE focus_participation p SET starts_at=old.starts_at,solo_ends_at=old.solo_ends_at,last_confirmed=old.starts_at+interval '58 seconds' FROM focus_participation old WHERE old.account_id=${account} AND old.client_id='complete-fixture' AND p.account_id=old.account_id AND p.client_id='overlap-fixture'`;
  const overlap = await a.call('solo',{operation:'heartbeat',clientId:'overlap-fixture'});
  assert.deepEqual(overlap.totals,completed.totals);
  await a.call('solo',{operation:'end',clientId:'overlap-fixture'});
  await a.call('solo',{operation:'start',clientId:'pause-fixture',durationMinutes:1});
  await a.call('solo',{operation:'pause',clientId:'pause-fixture'});
  await sql`UPDATE focus_participation SET starts_at=now()-interval '360 seconds',solo_ends_at=now()-interval '60 seconds',paused_at=now()-interval '330 seconds' WHERE account_id=${account} AND client_id='pause-fixture'`;
  await a.call('solo',{operation:'resume',clientId:'pause-fixture'});
  const resumed = await sql`SELECT solo_ends_at>now()+interval '25 seconds' AS extended FROM focus_participation WHERE account_id=${account} AND client_id='pause-fixture'`;
  assert.equal(resumed[0].extended,true);
  await a.call('solo',{operation:'end',clientId:'pause-fixture'});
  await a.call('solo',{operation:'resume',clientId:'pause-fixture'},409);
  const fixtureGroup = await a.call('group_create',{name:'Accounting fixtures',timezone:'UTC'});
  const fixtureSchedule = await a.call('group_schedule',{groupId:fixtureGroup.groupId,task:'Group accounting',startsAt:new Date(Date.now()+300000).toISOString(),focusMinutes:1,breakMinutes:1,rounds:1,saveTemplate:false});
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fixtureSchedule.scheduleId,operation:'join'});
  // Late arrival has only 35 seconds of evidence, and can never receive the full scheduled rep.
  await sql`WITH shifted AS (UPDATE focus_schedules SET starts_at=now()-interval '61 seconds' WHERE id=${fixtureSchedule.scheduleId} RETURNING starts_at) UPDATE focus_participation SET starts_at=shifted.starts_at,last_confirmed=now()-interval '5 seconds' FROM shifted WHERE account_id=${account} AND schedule_id=${fixtureSchedule.scheduleId}`;
  await sql`INSERT INTO focus_intervals(account_id,participation_id,starts_at,ends_at) SELECT account_id,id,starts_at+interval '26 seconds',last_confirmed FROM focus_participation WHERE account_id=${account} AND schedule_id=${fixtureSchedule.scheduleId}`;
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fixtureSchedule.scheduleId,operation:'heartbeat'});
  const late = await a.call(`group_view&groupId=${fixtureGroup.groupId}`);
  assert.equal(late.me.reps,0); assert.ok(late.me.focusedMinutes>0 && late.me.focusedMinutes<1);
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fixtureSchedule.scheduleId,operation:'leave'});
  console.log('PASS: isolated group late-join minutes never earn full-block rep');
  const fullSchedule = await a.call('group_schedule',{groupId:fixtureGroup.groupId,task:'Complete group rep',startsAt:new Date(Date.now()+300000).toISOString(),focusMinutes:1,breakMinutes:1,rounds:1,saveTemplate:false});
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fullSchedule.scheduleId,operation:'join'});
  await sql`WITH shifted AS (UPDATE focus_schedules SET starts_at=now()-interval '61 seconds' WHERE id=${fullSchedule.scheduleId} RETURNING starts_at) UPDATE focus_participation SET starts_at=shifted.starts_at,last_confirmed=now()-interval '5 seconds' FROM shifted WHERE account_id=${account} AND schedule_id=${fullSchedule.scheduleId}`;
  await sql`INSERT INTO focus_intervals(account_id,participation_id,starts_at,ends_at) SELECT account_id,id,starts_at,last_confirmed FROM focus_participation WHERE account_id=${account} AND schedule_id=${fullSchedule.scheduleId}`;
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fullSchedule.scheduleId,operation:'heartbeat'});
  const full = await a.call(`group_view&groupId=${fixtureGroup.groupId}`);
  assert.equal(full.me.reps,1,'full confirmed group block earns one rep');
  await a.call('participation',{groupId:fixtureGroup.groupId,scheduleId:fullSchedule.scheduleId,operation:'heartbeat'});
  const repeated = await a.call(`group_view&groupId=${fixtureGroup.groupId}`);
  assert.equal(repeated.me.reps,1,'repeated final heartbeats are successful and do not duplicate credit');
  // Ended groups must immediately release the account for its next source.
  await a.call('solo',{operation:'start',clientId:'after-group',durationMinutes:1});
  await a.call('solo',{operation:'end',clientId:'after-group'});
  assert.equal(full.accountTotals.reps,2,'account totals include solo and group credit once');
  console.log('PASS: full group rep, account totals and immediate next-session start');
  console.log('PASS: isolated PostgreSQL final-boundary credit, duplicate suppression, reconnect gap and global overlap fixtures');
}
const csrf = a.csrf; a.csrf = 'bad'; await a.call('logout',{},403); a.csrf = csrf;
await a.call('logout',{}); assert.equal((await a.call('bootstrap')).user,null);
console.log('PASS: real HTTP authentication, CSRF, access, invite revocation, consent defaults, schedules, active-source exclusion and leaving');
