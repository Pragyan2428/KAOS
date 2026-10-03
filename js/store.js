/* KAOS of Circuit 2.0 — demo data store
 * ----------------------------------------------------------------------------
 * FRONT-END DEMO ONLY. Everything here lives in the visitor's own browser
 * (localStorage). It is NOT secure and NOT shared between devices.
 * For a real deployment, replace this file with calls to a backend
 * (e.g. Firebase Auth + Firestore, or Supabase) — the rest of the panel only
 * talks to KAOS.store and KAOS.auth, so nothing else needs to change.
 *
 * Demo accounts (change or remove before going live):
 *   Super Admin  superadmin@kaos.demo  /  Kaos@Super2026
 *   Admin        admin@kaos.demo       /  Kaos@Admin2026
 *   Admin        events@kaos.demo      /  Kaos@Events2026
 */
window.KAOS = window.KAOS || {};

(function () {
  const KEY = 'kaos.data.v1';
  let memory = null;                       // fallback when localStorage is blocked

  const NAMES = ['Aarav Mishra','Ananya Das','Rohan Patnaik','Sneha Mohanty','Ishaan Sahu','Priya Nayak','Arjun Rout','Diya Panda',
    'Kabir Behera','Meera Pradhan','Aditya Jena','Riya Swain','Vivaan Sethi','Kavya Tripathy','Siddharth Dash','Tanvi Biswal',
    'Yash Mahapatra','Pooja Sahoo','Nikhil Acharya','Shreya Parida','Aryan Samal','Nisha Senapati','Rahul Barik','Ishita Kar',
    'Dev Lenka','Aditi Mallick','Karan Satpathy','Simran Ray','Harsh Bhoi','Lavanya Mohapatra','Om Pattnaik','Zara Hota',
    'Manav Sabat','Trisha Rath','Ayush Khuntia','Neha Choudhury'];
  const BRANCHES = ['EE', 'EEE', 'ECE', 'CSE', 'ME', 'ETC'];
  const EVENTS = ['Engineering Challenge', 'Project Expo'];
  const TEAMS = ['Volt Vipers','Circuit Breakers','Ohm Squad','Flux Capacitors','Spark Plugs','Neutral Zone','Phase Shifters','Live Wires',
    'Grounded','Short Circuit','Kirchhoff Krew','Tesla Coils'];

  function seed() {
    let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const base = new Date('2026-09-20T10:00:00+05:30').getTime();
    const registrations = NAMES.map((name, i) => {
      const day = Math.floor(Math.pow(rnd(), .7) * 14);            // more sign-ups closer to the deadline
      const status = rnd() < .58 ? 'verified' : rnd() < .8 ? 'pending' : 'rejected';
      const first = name.split(' ')[0].toLowerCase();
      return {
        id: 'R' + String(1001 + i),
        name, roll: String(2205000 + Math.floor(rnd() * 9000)),
        email: `${first}.${2205000 + i}@kiit.ac.in`,
        phone: '9' + String(Math.floor(100000000 + rnd() * 899999999)),
        branch: BRANCHES[Math.floor(rnd() * BRANCHES.length)], year: 1 + Math.floor(rnd() * 4),
        event: EVENTS[rnd() < .55 ? 0 : 1], team: TEAMS[Math.floor(rnd() * TEAMS.length)],
        status, registeredAt: new Date(base + day * 864e5 + rnd() * 8 * 36e5).toISOString()
      };
    });
    const now = new Date('2026-10-04T09:00:00+05:30').toISOString();
    return {
      version: 1,
      users: [
        { id: 'U1', name: 'Super Admin', email: 'superadmin@kaos.demo', password: 'Kaos@Super2026', role: 'superadmin', active: true, lastLogin: null, demo: true },
        { id: 'U2', name: 'Event Admin', email: 'admin@kaos.demo', password: 'Kaos@Admin2026', role: 'admin', active: true, lastLogin: null, demo: true },
        { id: 'U3', name: 'Events Desk', email: 'events@kaos.demo', password: 'Kaos@Events2026', role: 'admin', active: true, lastLogin: null, demo: false }
      ],
      registrations,
      announcements: [
        { id: 'A1', title: 'Registrations are open', body: 'Register your team for the Engineering Challenge and Project Expo before 3 October.', by: 'Super Admin', at: '2026-09-20T10:00:00+05:30' },
        { id: 'A2', title: 'Project Expo booth allotment', body: 'Booth numbers will be shared by email on Day 1 morning.', by: 'Event Admin', at: '2026-10-01T18:30:00+05:30' }
      ],
      settings: {
        registrationOpen: true, prizePool: 20000, day1: '2026-10-17', day2: '2026-10-18',
        maxTeamsPerEvent: 40, contactEmail: 'kes@kiit.ac.in', venue: 'KIIT Campus 3, Bhubaneswar'
      },
      log: [{ at: now, by: 'System', action: 'Demo data created', detail: `${registrations.length} sample registrations` }]
    };
  }

  function read() {
    if (memory) return memory;
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.version === 1) return (memory = d);
    } catch (e) { /* blocked or corrupt -> reseed */ }
    memory = seed(); write(memory); return memory;
  }
  function write(d) { memory = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* in-memory only */ } }

  KAOS.store = {
    get: read,
    /** mutate the data with fn(data) and persist it */
    update(fn) { const d = read(); fn(d); write(d); return d; },
    log(by, action, detail = '') {
      this.update(d => { d.log.unshift({ at: new Date().toISOString(), by, action, detail }); d.log = d.log.slice(0, 500); });
    },
    reset() { memory = seed(); write(memory); },
    uid: (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    EVENTS
  };
})();
