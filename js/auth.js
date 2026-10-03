/* KAOS of Circuit 2.0 — demo authentication
 * FRONT-END DEMO ONLY: passwords are checked in the browser, so anyone who reads
 * the source can get in. Swap KAOS.auth.login / current / logout for a real
 * provider (Firebase Auth, Supabase Auth, Auth0 …) before using real data.
 *
 * Roles:  admin       -> admin.html
 *         superadmin  -> super-admin.html (and admin.html)
 */
window.KAOS = window.KAOS || {};

(function () {
  const KEY = 'kaos.session';
  const storages = () => [sessionStorage, localStorage];
  const readSession = () => {
    for (const s of storages()) { try { const v = JSON.parse(s.getItem(KEY)); if (v) return v; } catch (e) {} }
    return null;
  };
  const clearSession = () => storages().forEach(s => { try { s.removeItem(KEY); } catch (e) {} });

  KAOS.auth = {
    login(email, password, remember) {
      email = String(email || '').trim().toLowerCase();
      const user = KAOS.store.get().users.find(u => u.email.toLowerCase() === email);
      if (!user || user.password !== password) return { ok: false, error: 'Incorrect email or password.' };
      if (!user.active) return { ok: false, error: 'This account has been disabled. Contact the Super Admin.' };
      clearSession();
      try { (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ id: user.id, at: Date.now() })); } catch (e) {}
      KAOS.store.update(d => { d.users.find(u => u.id === user.id).lastLogin = new Date().toISOString(); });
      KAOS.store.log(user.name, 'Signed in', user.role === 'superadmin' ? 'Super Admin' : 'Admin');
      return { ok: true, user };
    },

    /** the signed-in user, or null (also drops sessions for deleted/disabled accounts) */
    current() {
      const s = readSession(); if (!s) return null;
      const user = KAOS.store.get().users.find(u => u.id === s.id);
      if (!user || !user.active) { clearSession(); return null; }
      return user;
    },

    /** call at the top of a protected page; redirects to login if the role isn't allowed */
    require(roles) {
      const user = this.current();
      if (!user || !roles.includes(user.role)) {
        const next = encodeURIComponent(location.pathname.split('/').pop() || 'admin.html');
        location.replace(`login.html?next=${next}${user ? '&denied=1' : ''}`);
        throw new Error('redirecting to login');
      }
      return user;
    },

    logout() {
      const user = this.current();
      if (user) KAOS.store.log(user.name, 'Signed out');
      clearSession();
      location.href = 'login.html';
    },

    homeFor: (role) => role === 'superadmin' ? 'super-admin.html' : 'admin.html'
  };
})();
