/* KAOS of Circuit 2.0 — shared admin panel (used by admin.html and super-admin.html) */
window.KAOS = window.KAOS || {};

(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const fmtTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const STATUS = { verified: '✓ Verified', pending: '● Pending', rejected: '✕ Rejected' };
  const badge = (s) => `<span class="badge ${esc(s)}">${esc(STATUS[s] || s)}</span>`;

  let me, isSuper, root;

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function modal(title, bodyHtml, buttons) {
    const m = document.getElementById('modal');
    m.querySelector('.box').innerHTML = `<h3>${esc(title)}</h3>${bodyHtml}<div class="foot"></div>`;
    const foot = m.querySelector('.foot');
    buttons.forEach(([label, cls, fn]) => {
      const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label;
      b.onclick = () => { if (fn && fn(m) === false) return; m.classList.remove('open'); };
      foot.appendChild(b);
    });
    m.classList.add('open');
    m.querySelector('input,select,textarea,button')?.focus();
  }

  /* ======================= VIEWS ======================= */
  const VIEWS = {
    dashboard: {
      title: 'Dashboard', ico: '◧', render(d) {
        const R = d.registrations, s = d.settings;
        const count = (f) => R.filter(f).length;
        const teams = new Set(R.filter(r => r.status !== 'rejected').map(r => r.event + '|' + r.team)).size;
        // registrations per day
        const days = {}; R.forEach(r => { const k = r.registeredAt.slice(0, 10); days[k] = (days[k] || 0) + 1; });
        const keys = Object.keys(days).sort(); const start = new Date(keys[0]), end = new Date(keys[keys.length - 1]);
        const series = []; for (let t = new Date(start); t <= end; t.setDate(t.getDate() + 1)) { const k = t.toISOString().slice(0, 10); series.push([k, days[k] || 0]); }
        const byEvent = KAOS.store.EVENTS.map(e => [e, count(r => r.event === e && r.status !== 'rejected')]);
        const maxEv = Math.max(1, ...byEvent.map(x => x[1]));
        return `
          <div class="grid tiles">
            ${tile('Total registrations', R.length, `${teams} active teams`)}
            ${tile('Verified', count(r => r.status === 'verified'), 'ready to compete')}
            ${tile('Pending review', count(r => r.status === 'pending'), 'need a decision')}
            ${tile('Registrations', s.registrationOpen ? 'Open' : 'Closed', `Prize pool ₹${Number(s.prizePool).toLocaleString('en-IN')}`)}
          </div>
          <div class="grid two" style="margin-top:16px">
            <div class="card"><h2>Registrations per day</h2><div class="chart" id="dayChart">${barChart(series)}</div></div>
            <div class="card"><h2>By event <span style="font-weight:500;text-transform:none;letter-spacing:0">excl. rejected</span></h2>
              ${byEvent.map(([e, n]) => `<div class="hbar"><span>${esc(e)}</span><div class="track"><div class="fill" style="width:${n / maxEv * 100}%"></div></div><span class="num">${n}</span></div>`).join('')}
              <h2 style="margin-top:22px">Recent activity</h2>
              <div class="feed">${d.log.slice(0, 5).map(l => `<div class="item">${esc(l.action)} <span class="meta">· ${esc(l.by)} · ${fmtTime(l.at)}</span></div>`).join('')}</div>
            </div>
          </div>`;
      },
      after() { wireChart(document.getElementById('dayChart')); }
    },

    registrations: {
      title: 'Registrations', ico: '☰', render(d) {
        return `
          <div class="toolbar">
            <input class="input grow" id="q" type="search" placeholder="Search name, roll no, email or team…" aria-label="Search registrations">
            <select class="input" id="fEvent" aria-label="Filter by event"><option value="">All events</option>${KAOS.store.EVENTS.map(e => `<option>${esc(e)}</option>`).join('')}</select>
            <select class="input" id="fStatus" aria-label="Filter by status"><option value="">All statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
            <button class="btn" id="exportCsv">⭳ Export CSV</button>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>Participant</th><th>Branch</th><th>Event / Team</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="regRows"></tbody>
          </table></div>
          <p style="margin-top:10px;color:var(--faint);font-size:12px" id="regCount"></p>`;
      },
      after() {
        const rows = document.getElementById('regRows');
        const filtered = () => {
          const q = document.getElementById('q').value.trim().toLowerCase(), ev = document.getElementById('fEvent').value, st = document.getElementById('fStatus').value;
          return KAOS.store.get().registrations
            .filter(r => (!ev || r.event === ev) && (!st || r.status === st) && (!q || [r.name, r.roll, r.email, r.team].join(' ').toLowerCase().includes(q)))
            .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
        };
        const draw = () => {
          const list = filtered();
          rows.innerHTML = list.length ? list.map(r => `
            <tr>
              <td><b>${esc(r.name)}</b><span class="small">${esc(r.roll)} · ${esc(r.email)}</span></td>
              <td>${esc(r.branch)}<span class="small">Year ${esc(r.year)}</span></td>
              <td>${esc(r.event)}<span class="small">${esc(r.team)}</span></td>
              <td>${fmtDate(r.registeredAt)}</td>
              <td>${badge(r.status)}</td>
              <td><div class="actions">
                ${r.status !== 'verified' ? `<button class="btn sm good" data-act="verified" data-id="${esc(r.id)}">Verify</button>` : ''}
                ${r.status !== 'rejected' ? `<button class="btn sm bad" data-act="rejected" data-id="${esc(r.id)}">Reject</button>` : ''}
                <button class="btn sm ghost" data-act="view" data-id="${esc(r.id)}">View</button>
              </div></td>
            </tr>`).join('') : `<tr><td colspan="6" class="empty">No registrations match these filters.</td></tr>`;
          document.getElementById('regCount').textContent = `Showing ${list.length} of ${KAOS.store.get().registrations.length}`;
        };
        ['q', 'fEvent', 'fStatus'].forEach(id => document.getElementById(id).addEventListener('input', draw));
        rows.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-act]'); if (!b) return;
          const r = KAOS.store.get().registrations.find(x => x.id === b.dataset.id);
          if (b.dataset.act === 'view') return viewRegistration(r, draw);
          setStatus(r, b.dataset.act); draw();
        });
        document.getElementById('exportCsv').addEventListener('click', () => {
          const list = filtered(), cols = ['id', 'name', 'roll', 'email', 'phone', 'branch', 'year', 'event', 'team', 'status', 'registeredAt'];
          const csv = [cols.join(',')].concat(list.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))).join('\n');
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
          a.download = `kaos-registrations-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
          KAOS.store.log(me.name, 'Exported registrations', `${list.length} rows`); toast(`Exported ${list.length} registrations`);
        });
        draw();
      }
    },

    announcements: {
      title: 'Announcements', ico: '✎', render(d) {
        return `
          <div class="grid two">
            <div class="card"><h2>Published</h2><div class="feed" id="annList"></div></div>
            <form class="card" id="annForm"><h2>New announcement</h2>
              <div class="field"><label for="annTitle">Title</label><input class="input" id="annTitle" maxlength="80" required></div>
              <div class="field" style="margin-top:12px"><label for="annBody">Message</label><textarea class="input" id="annBody" maxlength="500" required></textarea></div>
              <button class="btn primary" style="margin-top:14px">Publish</button>
            </form>
          </div>`;
      },
      after() {
        const list = document.getElementById('annList');
        const draw = () => {
          const A = KAOS.store.get().announcements;
          list.innerHTML = A.length ? A.map(a => `<div class="item"><b>${esc(a.title)}</b><div>${esc(a.body)}</div>
            <div class="meta">${esc(a.by)} · ${fmtTime(a.at)} ${isSuper || a.by === me.name ? `· <button class="btn sm ghost" data-del="${esc(a.id)}">Delete</button>` : ''}</div></div>`).join('')
            : '<div class="empty">No announcements yet.</div>';
        };
        list.addEventListener('click', (e) => {
          const id = e.target.dataset.del; if (!id) return;
          const a = KAOS.store.get().announcements.find(x => x.id === id);
          KAOS.store.update(d => { d.announcements = d.announcements.filter(x => x.id !== id); });
          KAOS.store.log(me.name, 'Deleted announcement', a.title); draw(); toast('Announcement deleted');
        });
        document.getElementById('annForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const title = document.getElementById('annTitle').value.trim(), body = document.getElementById('annBody').value.trim();
          if (!title || !body) return;
          KAOS.store.update(d => d.announcements.unshift({ id: KAOS.store.uid('A'), title, body, by: me.name, at: new Date().toISOString() }));
          KAOS.store.log(me.name, 'Published announcement', title); e.target.reset(); draw(); toast('Announcement published');
        });
        draw();
      }
    },

    /* ---------- Super Admin only ---------- */
    admins: {
      title: 'Admin accounts', ico: '⚿', superOnly: true, render() {
        return `
          <div class="toolbar"><button class="btn primary" id="addAdmin">+ Add account</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead>
            <tbody id="adminRows"></tbody>
          </table></div>`;
      },
      after() {
        const rows = document.getElementById('adminRows');
        const draw = () => {
          rows.innerHTML = KAOS.store.get().users.map(u => {
            const self = u.id === me.id;
            return `<tr>
              <td><b>${esc(u.name)}</b>${self ? ' <span class="small" style="display:inline">(you)</span>' : ''}<span class="small">${esc(u.email)}</span></td>
              <td><span class="badge ${esc(u.role)}">${u.role === 'superadmin' ? '★ Super Admin' : 'Admin'}</span></td>
              <td><span class="badge ${u.active ? 'active' : 'disabled'}">${u.active ? '● Active' : '✕ Disabled'}</span></td>
              <td>${u.lastLogin ? fmtTime(u.lastLogin) : '<span class="small" style="display:inline">never</span>'}</td>
              <td><div class="actions">${self ? '' : `
                <button class="btn sm" data-act="role" data-id="${esc(u.id)}">${u.role === 'superadmin' ? 'Make Admin' : 'Make Super Admin'}</button>
                <button class="btn sm" data-act="toggle" data-id="${esc(u.id)}">${u.active ? 'Disable' : 'Enable'}</button>`}
                <button class="btn sm" data-act="reset" data-id="${esc(u.id)}">Reset password</button>
                ${self ? '' : `<button class="btn sm bad" data-act="delete" data-id="${esc(u.id)}">Delete</button>`}
              </div></td></tr>`;
          }).join('');
        };
        rows.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-act]'); if (!b) return;
          const u = KAOS.store.get().users.find(x => x.id === b.dataset.id);
          const supers = KAOS.store.get().users.filter(x => x.role === 'superadmin' && x.active).length;
          if (b.dataset.act === 'role') {
            if (u.role === 'superadmin' && supers <= 1) return toast('At least one active Super Admin is required');
            KAOS.store.update(d => { d.users.find(x => x.id === u.id).role = u.role === 'superadmin' ? 'admin' : 'superadmin'; });
            KAOS.store.log(me.name, 'Changed role', `${u.name} → ${u.role === 'superadmin' ? 'Admin' : 'Super Admin'}`); draw();
          }
          if (b.dataset.act === 'toggle') {
            if (u.active && u.role === 'superadmin' && supers <= 1) return toast('At least one active Super Admin is required');
            KAOS.store.update(d => { d.users.find(x => x.id === u.id).active = !u.active; });
            KAOS.store.log(me.name, u.active ? 'Disabled account' : 'Enabled account', u.name); draw();
          }
          if (b.dataset.act === 'reset') modal(`Reset password · ${u.name}`,
            `<div class="field"><label for="newPw">New password (min. 8 characters)</label><input class="input" id="newPw" type="password" minlength="8" autocomplete="new-password"></div>`,
            [['Cancel', 'ghost'], ['Save password', 'primary', () => {
              const pw = document.getElementById('newPw').value;
              if (pw.length < 8) { toast('Password must be at least 8 characters'); return false; }
              KAOS.store.update(d => { d.users.find(x => x.id === u.id).password = pw; });
              KAOS.store.log(me.name, 'Reset password', u.name); toast('Password updated');
            }]]);
          if (b.dataset.act === 'delete') modal('Delete account?', `<p>${esc(u.name)} (${esc(u.email)}) will lose access immediately.</p>`,
            [['Cancel', 'ghost'], ['Delete', 'primary', () => {
              if (u.role === 'superadmin' && supers <= 1) { toast('At least one active Super Admin is required'); return; }
              KAOS.store.update(d => { d.users = d.users.filter(x => x.id !== u.id); });
              KAOS.store.log(me.name, 'Deleted account', u.name); draw(); toast('Account deleted');
            }]]);
        });
        document.getElementById('addAdmin').addEventListener('click', () => modal('Add account', `
          <div class="form-grid" style="grid-template-columns:1fr">
            <div class="field"><label for="nName">Full name</label><input class="input" id="nName" required></div>
            <div class="field"><label for="nEmail">Email</label><input class="input" id="nEmail" type="email" required></div>
            <div class="field"><label for="nRole">Role</label><select class="input" id="nRole"><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></div>
            <div class="field"><label for="nPw">Temporary password (min. 8)</label><input class="input" id="nPw" type="password" autocomplete="new-password"></div>
          </div>`, [['Cancel', 'ghost'], ['Create account', 'primary', () => {
            const name = document.getElementById('nName').value.trim(), email = document.getElementById('nEmail').value.trim().toLowerCase();
            const role = document.getElementById('nRole').value, password = document.getElementById('nPw').value;
            if (!name || !/^\S+@\S+\.\S+$/.test(email)) { toast('Enter a name and a valid email'); return false; }
            if (password.length < 8) { toast('Password must be at least 8 characters'); return false; }
            if (KAOS.store.get().users.some(u => u.email.toLowerCase() === email)) { toast('An account with that email already exists'); return false; }
            KAOS.store.update(d => d.users.push({ id: KAOS.store.uid('U'), name, email, password, role, active: true, lastLogin: null, demo: false }));
            KAOS.store.log(me.name, 'Created account', `${name} (${role === 'superadmin' ? 'Super Admin' : 'Admin'})`); draw(); toast('Account created');
          }]]));
        draw();
      }
    },

    settings: {
      title: 'Event settings', ico: '⚙', superOnly: true, render(d) {
        const s = d.settings;
        return `
          <form class="card" id="setForm">
            <h2>Registration</h2>
            <label class="switch"><input type="checkbox" id="sOpen" ${s.registrationOpen ? 'checked' : ''}> Registrations open</label>
            <p style="color:var(--faint);font-size:12px;margin-top:6px">When closed, the website's "Register Now" button shows "Registrations Closed".</p>
            <h2 style="margin-top:24px">Event details</h2>
            <div class="form-grid">
              <div class="field"><label for="sPrize">Prize pool (₹)</label><input class="input" id="sPrize" type="number" min="0" step="500" value="${esc(s.prizePool)}"></div>
              <div class="field"><label for="sMax">Max teams per event</label><input class="input" id="sMax" type="number" min="1" value="${esc(s.maxTeamsPerEvent)}"></div>
              <div class="field"><label for="sD1">Day 1 · Engineering Challenge</label><input class="input" id="sD1" type="date" value="${esc(s.day1)}"></div>
              <div class="field"><label for="sD2">Day 2 · Project Expo</label><input class="input" id="sD2" type="date" value="${esc(s.day2)}"></div>
              <div class="field"><label for="sVenue">Venue</label><input class="input" id="sVenue" value="${esc(s.venue)}"></div>
              <div class="field"><label for="sMail">Contact email</label><input class="input" id="sMail" type="email" value="${esc(s.contactEmail)}"></div>
            </div>
            <button class="btn primary" style="margin-top:20px">Save settings</button>
          </form>
          <div class="card danger" style="margin-top:16px"><h2>Danger zone</h2>
            <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Restore all demo data (registrations, accounts, settings, log) on this browser.</p>
            <button class="btn bad" id="resetData">Reset demo data</button>
          </div>`;
      },
      after() {
        document.getElementById('setForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const v = (id) => document.getElementById(id).value;
          KAOS.store.update(d => Object.assign(d.settings, {
            registrationOpen: document.getElementById('sOpen').checked, prizePool: Math.max(0, Number(v('sPrize')) || 0),
            maxTeamsPerEvent: Math.max(1, Number(v('sMax')) || 1), day1: v('sD1'), day2: v('sD2'), venue: v('sVenue').trim(), contactEmail: v('sMail').trim()
          }));
          KAOS.store.log(me.name, 'Updated event settings'); toast('Settings saved — the website updates on next load');
        });
        document.getElementById('resetData').addEventListener('click', () => modal('Reset all demo data?',
          '<p>This replaces everything stored in this browser with the original demo data and signs you out.</p>',
          [['Cancel', 'ghost'], ['Reset', 'primary', () => { KAOS.store.reset(); KAOS.auth.logout(); }]]));
      }
    },

    activity: {
      title: 'Activity log', ico: '⧗', superOnly: true, render(d) {
        const people = [...new Set(d.log.map(l => l.by))];
        return `
          <div class="toolbar"><select class="input" id="fBy" aria-label="Filter by person"><option value="">Everyone</option>${people.map(p => `<option>${esc(p)}</option>`).join('')}</select></div>
          <div class="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead><tbody id="logRows"></tbody></table></div>`;
      },
      after() {
        const draw = () => {
          const by = document.getElementById('fBy').value;
          const L = KAOS.store.get().log.filter(l => !by || l.by === by);
          document.getElementById('logRows').innerHTML = L.map(l => `<tr><td style="white-space:nowrap">${fmtTime(l.at)}</td><td>${esc(l.by)}</td><td>${esc(l.action)}</td><td class="small" style="display:table-cell">${esc(l.detail)}</td></tr>`).join('')
            || '<tr><td colspan="4" class="empty">Nothing logged yet.</td></tr>';
        };
        document.getElementById('fBy').addEventListener('input', draw); draw();
      }
    }
  };

  /* ======================= helpers ======================= */
  function tile(label, value, note) {
    return `<div class="card tile"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="note">${esc(note)}</div></div>`;
  }
  function barChart(series) {
    const W = 600, H = 210, pl = 28, pb = 24, pt = 10, max = Math.max(4, ...series.map(s => s[1]));
    const step = Math.ceil(max / 4), top = step * 4, bw = (W - pl) / series.length;
    const y = (v) => pt + (H - pt - pb) * (1 - v / top);
    let g = '';
    for (let v = 0; v <= top; v += step) g += `<line class="grid-line" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
    const bars = series.map(([k, v], i) => {
      const x = pl + i * bw + 2, w = Math.max(2, bw - 4), h = (H - pt - pb) - (y(v) - pt);
      const r = Math.min(4, w / 2, h);
      const path = v ? `M${x} ${y(0)} V${y(v) + r} Q${x} ${y(v)} ${x + r} ${y(v)} H${x + w - r} Q${x + w} ${y(v)} ${x + w} ${y(v) + r} V${y(0)}Z` : '';
      return `<g class="hit" data-k="${k}" data-v="${v}"><rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent"/>${path ? `<path class="bar" d="${path}"/>` : ''}</g>`;
    }).join('');
    const labels = series.map(([k], i) => i % 2 === 0 ? `<text x="${pl + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${fmtDate(k)}</text>` : '').join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of registrations per day"><g class="axis">${g}${labels}</g>${bars}</svg><div class="tip"></div>`;
  }
  function wireChart(el) {
    const tip = el.querySelector('.tip'), svg = el.querySelector('svg');
    el.querySelectorAll('.hit').forEach(h => {
      h.addEventListener('pointerenter', () => {
        el.querySelectorAll('.bar').forEach(b => b.classList.toggle('dim', !h.contains(b)));
        const r = h.getBoundingClientRect(), base = el.getBoundingClientRect(), bar = h.querySelector('.bar');
        const top = bar ? bar.getBoundingClientRect().top : r.bottom - 20;
        tip.innerHTML = `<b>${h.dataset.v} registration${h.dataset.v === '1' ? '' : 's'}</b>${fmtDate(h.dataset.k)}`;
        tip.style.left = (r.left - base.left + r.width / 2) + 'px'; tip.style.top = (top - base.top - 4) + 'px'; tip.style.opacity = 1;
      });
    });
    svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; el.querySelectorAll('.bar').forEach(b => b.classList.remove('dim')); });
  }
  function setStatus(r, status) {
    KAOS.store.update(d => { d.registrations.find(x => x.id === r.id).status = status; });
    KAOS.store.log(me.name, status === 'verified' ? 'Verified registration' : 'Rejected registration', `${r.name} · ${r.event}`);
    toast(`${r.name} ${status === 'verified' ? 'verified' : 'rejected'}`);
  }
  function viewRegistration(r, redraw) {
    const btns = [['Close', 'ghost']];
    if (isSuper) btns.unshift(['Delete registration', 'bad', () => {
      KAOS.store.update(d => { d.registrations = d.registrations.filter(x => x.id !== r.id); });
      KAOS.store.log(me.name, 'Deleted registration', `${r.name} · ${r.event}`); redraw(); toast('Registration deleted');
    }]);
    modal(r.name, `<dl class="kv">
      <dt>Registration ID</dt><dd>${esc(r.id)}</dd><dt>Roll number</dt><dd>${esc(r.roll)}</dd>
      <dt>Email</dt><dd>${esc(r.email)}</dd><dt>Phone</dt><dd>${esc(r.phone)}</dd>
      <dt>Branch / Year</dt><dd>${esc(r.branch)} · Year ${esc(r.year)}</dd><dt>Event</dt><dd>${esc(r.event)}</dd>
      <dt>Team</dt><dd>${esc(r.team)}</dd><dt>Registered</dt><dd>${fmtTime(r.registeredAt)}</dd><dt>Status</dt><dd>${badge(r.status)}</dd></dl>`, btns);
  }

  /* ======================= shell ======================= */
  KAOS.panel = {
    mount(opts) {
      me = KAOS.auth.require(opts.roles);
      isSuper = me.role === 'superadmin';
      const views = Object.entries(VIEWS).filter(([, v]) => !v.superOnly || opts.superPanel);
      document.body.innerHTML = `
        <div class="shell">
          <aside class="side" id="side">
            <div class="brand"><a href="index.html" title="Open website"><img src="assets/nav-logo.png" alt="KAOS of Circuit 2.0"></a><br>
              <span class="role-tag">${opts.superPanel ? 'SUPER ADMIN' : 'ADMIN PANEL'}</span></div>
            <nav class="nav" aria-label="Panel sections">
              ${views.filter(([, v]) => !v.superOnly).map(([k, v]) => `<a href="#${k}" data-view="${k}"><span class="ico">${v.ico}</span>${v.title}</a>`).join('')}
              ${opts.superPanel ? `<div class="group">SUPER ADMIN</div>` + views.filter(([, v]) => v.superOnly).map(([k, v]) => `<a href="#${k}" data-view="${k}"><span class="ico">${v.ico}</span>${v.title}</a>`).join('') : ''}
              ${isSuper && !opts.superPanel ? `<div class="group">SWITCH</div><a href="super-admin.html"><span class="ico">★</span>Super Admin panel</a>` : ''}
              ${opts.superPanel ? `<div class="group">SWITCH</div><a href="admin.html"><span class="ico">◨</span>Admin panel view</a>` : ''}
            </nav>
            <div class="foot">
              <div class="who"><b>${esc(me.name)}</b>${esc(me.email)}</div>
              <div style="display:flex;gap:8px"><a class="btn sm ghost" href="index.html">Website</a><button class="btn sm" id="logout">Sign out</button></div>
            </div>
          </aside>
          <main class="main">
            <div class="topbar"><div><div class="crumb">${opts.superPanel ? 'Super Admin' : 'Admin'} · KAOS of Circuit 2.0</div><h1 id="viewTitle"></h1></div>
              <button class="btn menu-btn" id="menuBtn" aria-label="Open menu">☰ Menu</button></div>
            <div class="demo-banner">Demo mode — data is stored only in this browser. Connect a backend before using real participant data.</div>
            <div id="view"></div>
          </main>
        </div>
        <div class="modal" id="modal" role="dialog" aria-modal="true"><div class="box"></div></div>`;
      root = document.getElementById('view');
      document.getElementById('logout').onclick = () => KAOS.auth.logout();
      document.getElementById('menuBtn').onclick = () => document.getElementById('side').classList.toggle('open');
      document.getElementById('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('open'); });
      addEventListener('keydown', (e) => { if (e.key === 'Escape') document.getElementById('modal').classList.remove('open'); });
      const route = () => {
        const key = location.hash.slice(1);
        const [k, v] = views.find(([name]) => name === key) || views[0];
        document.getElementById('viewTitle').textContent = v.title;
        document.title = `${v.title} · ${opts.superPanel ? 'Super Admin' : 'Admin'} · KAOS`;
        document.querySelectorAll('.nav a[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === k));
        root.innerHTML = v.render(KAOS.store.get());
        v.after && v.after();
        document.getElementById('side').classList.remove('open');
      };
      addEventListener('hashchange', route); route();
    }
  };
})();
