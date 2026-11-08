/** Optional, same-origin group controller. No group data is persisted on the device. */
export function initGroups(root, win, { fetchFn = win.fetch?.bind(win), now = Date.now, setIntervalFn = win.setInterval.bind(win), clearIntervalFn = win.clearInterval.bind(win) } = {}) {
  const doc = root.ownerDocument || root;
  const panel = doc.createElement('details'); panel.id = 'focus-groups'; panel.className = 'focus-extra focus-groups';
  panel.innerHTML = '<summary>Study together</summary><p data-group-status role="status"></p><p data-group-phase role="status"></p><div data-group-content></div>';
  root.querySelector('#focus-extras')?.append(panel);
  const content = panel.querySelector('[data-group-content]'), status = panel.querySelector('[data-group-status]');
  let account = null, csrf = '', groups = [], current = null, offset = 0, loaded = false, destroyed = false, version = 0, heartbeatId, pollId, clockId;
  let active = false, confirmationLost = false, observedPhase = null, pending = Promise.resolve(), accountVersion = 0;
  const confirmedBoundaries = new Set();
  const phaseStatus = panel.querySelector('[data-group-phase]');
  const fragment = new URLSearchParams(win.location.hash.slice(1));
  let invite = fragment.get('invite'), resetToken = fragment.get('reset');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const say = message => { if (!destroyed) status.textContent = message; };
  const clearSecrets = () => { win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}`); };
  // Remove credentials immediately, retaining them only in this controller's memory.
  if (invite || resetToken) clearSecrets();
  async function api(action, body, params = {}) {
    if (!fetchFn) throw new Error('Study together is unavailable. Your personal timer still works.');
    const requestAccountVersion = accountVersion;
    const query = new URLSearchParams({ action, ...params });
    const options = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } };
    if (body !== undefined) { options.headers['Content-Type'] = 'application/json'; options.headers['X-CSRF-Token'] = csrf; options.body = JSON.stringify(body); }
    let response, data;
    try { response = await fetchFn(`api/focus/index.php?${query}`, options); data = await response.json(); }
    catch { throw new Error('Study together is unavailable. Your personal timer still works.'); }
    if (!response.ok || !data.ok) throw new Error(data.message || 'Unable to update Study together.');
    if (data.serverTime) offset = Date.parse(data.serverTime) - now();
    const authResponse = ['bootstrap', 'login', 'register', 'logout'].includes(action);
    if (!destroyed && data.accountTotals && (authResponse ? data.user : account && requestAccountVersion === accountVersion)) {
      win.dispatchEvent(new win.CustomEvent('reps:account-totals', { detail: data.accountTotals }));
    }
    return data;
  }
  function enqueue(work) {
    pending = pending.then(async () => { if (!destroyed) await work(); }).catch(error => say(error.message));
    return pending;
  }
  function stopHeartbeat() { if (heartbeatId !== undefined) clearIntervalFn(heartbeatId); heartbeatId = undefined; }
  function setActive(value) {
    const changed = active !== value;
    active = value; stopHeartbeat();
    if (changed) win.dispatchEvent(new win.CustomEvent('reps:group-participation', { detail: { active, groupId: current?.group.id || null } }));
    if (active) heartbeatId = setIntervalFn(() => enqueue(async () => {
      if (!active || !current?.schedule) return;
      try { await api('participation', { groupId: current.group.id, scheduleId: current.schedule.id, operation: 'heartbeat' }); }
      catch (error) { confirmationLost = true; setActive(false); current.me.state = 'Paused'; current.me.participating = false; renderGroup(); throw error; }
    }), 15000);
  }
  function authForm(kind, fields, title) {
    return `<form data-auth-${kind}><h4>${title}</h4>${fields.map(([name, label, type]) => `<label>${label}<input name="${name}" type="${type}" required ${name === 'password' ? 'minlength="12" autocomplete="' + (kind === 'login' ? 'current-password' : 'new-password') + '"' : ''}></label>`).join('')}<button type="submit">${title}</button></form>`;
  }
  function renderAccount(recoveryAvailable) {
    if (!account) {
      content.innerHTML = `${invite ? '<p>Sign in to accept your private group invitation.</p>' : ''}${authForm('login', [['email', 'Email', 'email'], ['password', 'Password', 'password']], 'Sign in')}<details><summary>Create an account</summary>${authForm('register', [['name', 'Display name', 'text'], ['email', 'Email', 'email'], ['password', 'Password', 'password']], 'Create account')}</details><details><summary>Reset password</summary><p data-recovery-status>${recoveryAvailable ? 'Request a password reset by email.' : 'Password recovery email delivery is not configured.'}</p>${resetToken ? authForm('reset', [['password', 'New password', 'password']], 'Set new password') : recoveryAvailable ? authForm('recovery', [['email', 'Email', 'email']], 'Request reset') : ''}</details>`;
      return;
    }
    content.innerHTML = `<p>Signed in as ${escape(account.name)} <button type="button" data-auth-logout>Sign out</button></p>${invite ? '<button type="button" data-invite-accept>Accept group invitation</button>' : ''}<label>Your groups<select data-group-select><option value="">Choose a group</option>${groups.map(g => `<option value="${escape(g.id)}">${escape(g.name)}</option>`).join('')}</select></label><details><summary>Create a private group</summary><form data-group-create><label>Group name<input name="name" required maxlength="100"></label><button>Create group</button></form></details><div data-group-view></div>`;
  }
  function updateCountdown() {
    const target = content.querySelector('[data-group-countdown]'), s = current?.schedule;
    if (!target || !s) return;
    const t = now() + offset - Date.parse(s.startsAt), focus = s.focusMinutes * 60000, rest = s.breakMinutes * 60000, cycle = focus + rest;
    let state, remaining;
    if (t < 0) { state = 'Starts in'; remaining = -t; }
    else if (t >= cycle * (s.rounds - 1) + focus) { state = 'Finished'; remaining = 0; }
    else { const within = t % cycle; state = within < focus ? 'Focusing' : 'On break'; remaining = within < focus ? focus - within : cycle - within; }
    const phase = state === 'Focusing' ? 'focus' : state === 'On break' ? 'break' : null;
    const round = Math.min(s.rounds, Math.max(1, Math.floor(t / cycle) + 1));
    const marker = { scheduleId: s.id, round, phase, state, elapsed: t, key: `${s.id}-${round}-${state}` };
    if (observedPhase?.key !== marker.key) {
      const previous = observedPhase;
      observedPhase = marker;
      if (previous?.scheduleId === s.id && previous.phase && t > previous.elapsed && active && !confirmationLost) {
        // After delayed wake, announce the most recent boundary rather than replaying every missed round.
        const endedPhase = state === 'Focusing' ? 'break' : 'focus';
        const endedRound = state === 'Focusing' ? round - 1 : round;
        const boundaryId = `group-${s.id}-${endedRound}-${endedPhase}`;
        if (!confirmedBoundaries.has(boundaryId)) {
          confirmedBoundaries.add(boundaryId);
          const groupId = current.group.id, scheduleId = s.id, final = state === 'Finished';
          enqueue(async () => {
            try {
              await api('participation', { groupId, scheduleId, operation: 'heartbeat' });
              if (final && current?.schedule?.id === scheduleId) await loadGroup(groupId, true);
            } catch (error) {
              if (current?.schedule?.id === scheduleId) { confirmationLost = true; setActive(false); current.me.state = 'Paused'; current.me.participating = false; renderGroup(); }
              throw error;
            }
          });
        }
        phaseStatus.textContent = endedPhase === 'focus' ? 'Shared focus finished. Take a breather. Recorded credit depends on your confirmed participation.' : 'Shared break finished. Ready for the next round?';
        win.dispatchEvent(new win.CustomEvent('reps:group-complete', { detail: { id: boundaryId, phase: endedPhase } }));
      } else phaseStatus.textContent = `Shared session: ${state}.`;
    }
    const seconds = Math.ceil(remaining / 1000);
    target.textContent = `${state} · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    target.setAttribute('aria-live', 'off');
    if (state === 'Finished' && active) { setActive(false); renderGroup(); }
  }
  function renderGroup() {
    const target = content.querySelector('[data-group-view]'); if (!target || !current) return;
    const { group, membership, schedule: s, template, participants = [], leaderboard = [], me } = current;
    const owner = group.ownerId === account?.id, defaults = template || s || { focusMinutes: 25, breakMinutes: 5, rounds: 1 };
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    target.innerHTML = `<h3>${escape(group.name)}</h3>${s ? `<p>${escape(s.task)}</p><p data-group-countdown></p><p data-group-timezone>Starts ${escape(new Date(s.startsAt).toLocaleString())} (${escape(localZone)}). Group week: ${escape(group.timezone)}.</p><p>Your recorded progress: ${escape(me.focusedMinutes)} minutes · ${escape(me.reps)} reps</p><div class="group-actions">${!active ? `<button type="button" data-participation="${me.state === 'Paused' ? 'resume' : 'join'}">${me.state === 'Paused' ? 'Resume participation' : 'Join this session'}</button>` : '<button type="button" data-participation="pause">Pause my participation</button>'}<button type="button" data-participation="leave">Leave this session</button></div><p class="group-hint">Personal pauses never change the shared clock. Only confirmed focus time counts; a pause or connection gap forfeits that round’s rep.</p>` : '<p>No session scheduled.</p>'}<details><summary>Progress sharing</summary><form data-group-preferences><label><input type="checkbox" name="shareProgress" ${membership.shareProgress ? 'checked' : ''}> Share my live progress with this group</label><label><input type="checkbox" name="showRanking" ${membership.showRanking ? 'checked' : ''}> Include me in the group weekly ranking</label>${owner ? `<label><input type="checkbox" name="leaderboardEnabled" ${group.leaderboardEnabled ? 'checked' : ''}> Enable this group’s weekly leaderboard</label>` : ''}<button>Save preferences</button></form></details><div data-group-participants><h4>Shared progress</h4>${participants.length ? participants.map(p => `<p>${escape(p.name)} · ${escape(p.state)} · ${escape(p.focusedMinutes)} min · ${escape(p.reps)} reps</p>`).join('') : '<p>No shared progress yet.</p>'}</div><details><summary>Weekly leaderboard</summary><div data-group-ranking>${group.leaderboardEnabled ? leaderboard.length ? '<ol>' + leaderboard.map(p => `<li>${escape(p.name)} · ${escape(p.focusedMinutes)} min · ${escape(p.reps)} reps</li>`).join('') + '</ol>' : '<p>No opted-in rankings yet.</p>' : '<p>The group leaderboard is disabled.</p>'}</div></details>${owner ? `<details><summary>Manage group</summary><button type="button" data-invite-rotate>Create or replace invite link</button><p>Replacing the link revokes the previous invitation.</p><label>Private invite link<input data-invite-link readonly></label><form data-group-schedule><h4>Schedule a session</h4><label>Shared outcome<input name="task" required maxlength="300" value="${escape(defaults.task || '')}"></label><label>Start in your local time (${escape(localZone)})<input name="startsAt" type="datetime-local" required></label><label>Focus minutes<input type="number" name="focusMinutes" min="1" max="180" required value="${defaults.focusMinutes}"></label><label>Break minutes<input type="number" name="breakMinutes" min="1" max="60" required value="${defaults.breakMinutes}"></label><label>Rounds<input type="number" name="rounds" min="1" max="8" required value="${defaults.rounds}"></label><label><input type="checkbox" name="saveTemplate"> Save as reusable template</label><button>Schedule session</button></form></details>` : ''}<details><summary>Membership</summary><button type="button" data-group-leave>Leave group</button></details>`;
    updateCountdown();
  }
  async function loadGroup(id, preserveDraft = false) {
    const requestVersion = ++version;
    const result = await api('group_view', undefined, { groupId: id });
    if (destroyed || requestVersion !== version) return;
    const previous = content.querySelector('[data-group-view]');
    const drafts = preserveDraft && current?.group.id === id ? {
      details: [...previous.querySelectorAll('details')].map(detail => detail.open),
      inputs: [...previous.querySelectorAll('input')].map(input => ({ name: input.name, value: input.value, checked: input.checked, invite: input.hasAttribute('data-invite-link') })),
    } : null;
    if (current?.schedule?.id !== result.schedule?.id) { observedPhase = null; phaseStatus.textContent = ''; }
    current = result;
    // Polls can finalize participation, so observe the boundary before replacing our active state.
    updateCountdown();
    if (confirmationLost && result.me.state !== 'Finished') { current.me.state = 'Paused'; current.me.participating = false; }
    setActive(Boolean(current.me.participating) && current.me.state !== 'Paused' && current.me.state !== 'Finished'); renderGroup();
    if (drafts) {
      [...previous.querySelectorAll('details')].forEach((detail, index) => { detail.open = drafts.details[index] || false; });
      for (const draft of drafts.inputs) {
        const input = draft.invite ? previous.querySelector('[data-invite-link]') : [...previous.querySelectorAll('input')].find(item => item.name === draft.name);
        if (input) { input.value = draft.value; input.checked = draft.checked; }
      }
    }
  }
  async function bootstrap(data) {
    const result = data || await api('bootstrap'); account = result.user; csrf = result.csrf; groups = result.groups || [];
    accountVersion++;
    win.dispatchEvent(new win.CustomEvent('reps:account', { detail: { user: account } }));
    current = null; observedPhase = null; phaseStatus.textContent = ''; confirmationLost = false; version++; setActive(false); renderAccount(result.recoveryAvailable);
    if (account && groups[0]) { content.querySelector('[data-group-select]').value = groups[0].id; await loadGroup(groups[0].id); }
    loaded = true;
  }
  panel.addEventListener('toggle', () => {
    if (panel.open && !loaded) enqueue(async () => { await bootstrap(); say(''); });
  });
  content.addEventListener('change', event => {
    if (event.target.matches('[data-group-select]')) { const id = event.target.value; version++; current = null; observedPhase = null; phaseStatus.textContent = ''; setActive(false); content.querySelector('[data-group-view]').replaceChildren(); if (id) enqueue(() => loadGroup(id)); }
  });
  content.addEventListener('submit', event => {
    event.preventDefault(); const form = event.target;
    if (form.getAttribute('aria-busy') === 'true') return;
    const authentication = form.matches('[data-auth-login], [data-auth-register]');
    const submitButton = form.querySelector('button[type="submit"]');
    if (authentication) {
      form.setAttribute('aria-busy', 'true'); submitButton.disabled = true;
      formMessage(form, form.matches('[data-auth-login]') ? 'Signing in…' : 'Creating your account…');
    }
    const values = Object.fromEntries(new win.FormData(form));
    enqueue(async () => {
      say('');
      phaseStatus.textContent = '';
      if (authentication) {
        try { await bootstrap(await api(form.matches('[data-auth-login]') ? 'login' : 'register', values)); }
        catch (error) { formMessage(form, error.message); throw error; }
        finally { form.removeAttribute('aria-busy'); submitButton.disabled = false; }
        return;
      }
      if (form.matches('[data-auth-recovery]')) { const result = await api('reset_request', values); say(result.message || 'If the account exists, recovery instructions will be sent.'); return; }
      if (form.matches('[data-auth-reset]')) { await api('reset_password', { token: resetToken, password: values.password }); resetToken = null; await bootstrap(); say('Password updated. Sign in with your new password.'); return; }
      if (form.matches('[data-group-create]')) { const result = await api('group_create', { name: values.name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); await bootstrap(); content.querySelector('[data-group-select]').value = result.groupId; await loadGroup(result.groupId); return; }
      if (!current) return;
      const groupId = current.group.id;
      if (form.matches('[data-group-preferences]')) {
        const prefs = { groupId, shareProgress: form.elements.shareProgress.checked, showRanking: form.elements.showRanking.checked };
        if (form.elements.leaderboardEnabled) prefs.leaderboardEnabled = form.elements.leaderboardEnabled.checked;
        await api('group_preferences', prefs); await loadGroup(groupId); say('Sharing preferences saved.');
      }
      if (form.matches('[data-group-schedule]')) { await api('group_schedule', { groupId, task: values.task, startsAt: new Date(values.startsAt).toISOString(), focusMinutes: Number(values.focusMinutes), breakMinutes: Number(values.breakMinutes), rounds: Number(values.rounds), saveTemplate: form.elements.saveTemplate.checked }); await loadGroup(groupId); say('Session scheduled.'); }
    });
  });
  function formMessage(form, message) {
    let output = form.querySelector('[data-form-status]');
    if (!output) { output = doc.createElement('p'); output.dataset.formStatus = ''; output.setAttribute('role', 'status'); form.append(output); }
    output.textContent = message;
  }
  content.addEventListener('invalid', event => {
    const field = event.target;
    if (field.form) formMessage(field.form, `Check ${field.name === 'name' ? 'display name' : field.name}: ${field.validationMessage}`);
  }, true);
  content.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || button.type === 'submit') return;
    enqueue(async () => {
      say('');
      phaseStatus.textContent = '';
      if (button.matches('[data-auth-logout]')) { await bootstrap(await api('logout', {})); return; }
      if (button.matches('[data-invite-accept]')) { const result = await api('invite_join', { token: invite }); invite = null; await bootstrap(); content.querySelector('[data-group-select]').value = result.groupId; await loadGroup(result.groupId); return; }
      if (!current) return;
      const groupId = current.group.id;
      if (button.matches('[data-invite-rotate]')) { const result = await api('invite_rotate', { groupId }); content.querySelector('[data-invite-link]').value = new URL(`focus.html#invite=${encodeURIComponent(result.inviteToken)}`, win.location.href).href; say('New invite link created. Previous links are revoked.'); }
      if (button.matches('[data-group-leave]')) { await api('group_leave', { groupId }); await bootstrap(); say('You have left the group.'); }
      if (button.dataset.participation && current.schedule) {
        const operation = button.dataset.participation;
        await api('participation', { groupId, scheduleId: current.schedule.id, operation });
        updateCountdown();
        confirmationLost = false;
        setActive(operation === 'join' || operation === 'resume'); current.me.state = active ? 'Focusing' : operation === 'pause' ? 'Paused' : 'Waiting'; current.me.participating = active; renderGroup();
      }
    });
  });
  const refreshVisible = () => {
    const focused = doc.activeElement;
    const editing = content.contains(focused) && focused.matches('input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])');
    if (loaded && panel.open && current && !doc.hidden && !editing) { const id = current.group.id; return enqueue(() => loadGroup(id, true)); }
  };
  doc.addEventListener('visibilitychange', refreshVisible);
  win.addEventListener('online', refreshVisible);
  pollId = setIntervalFn(refreshVisible, 20000);
  clockId = setIntervalFn(() => { if (panel.open || active) updateCountdown(); }, 1000);
  return {
    getUser: () => account,
    ensureReady: () => enqueue(async () => { if (!loaded) await bootstrap(); }),
    getCsrf: () => csrf,
    callSolo: body => api('solo', body),
    flush: () => pending,
    destroy() { destroyed = true; version++; stopHeartbeat(); clearIntervalFn(pollId); clearIntervalFn(clockId); doc.removeEventListener('visibilitychange', refreshVisible); win.removeEventListener('online', refreshVisible); panel.remove(); },
  };
}
