/* Mobile menu toggle */
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking on a link
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
});

/* Smooth-scroll for in-page nav */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const href = a.getAttribute('href');
    if(href.length > 1){
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

/* Reveal-on-scroll */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('revealed');
      io.unobserve(entry.target);
    }
  })
}, {threshold: 0.15});
document.querySelectorAll('.fade-up').forEach(el=>io.observe(el));

/* Footer year */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---- EVENTS DATA ----
   Edit this array with your events. Use ISO dates: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM'
   Fields:
   - title (string)
   - date (string)
   - venue (string)
   - city (string)
   - link (optional, string)
*/
const EVENTS = [
  // FUTURE (sample)
  { title: "Cuesic Launch Party", date: "2025-10-01T20:00", venue: "TBD", city: "New Brunswick, NJ", link: "#" },
  { title: "Coffee Shop Pop-Up (EDM Edition)", date: "TBD", venue: "TBD", city: "New Brunswick, NJ", link: "#" },

  // PAST (sample)
  //{ title: "Cuesic Launch Party", date: "2025-06-28T20:00", venue: "The Stack", city: "Jersey City, NJ", link: "#" },
];

/* Render events into Upcoming / Past */
const upcomingEl = document.getElementById('upcoming');
const pastEl = document.getElementById('past');

function formatDate(iso){
  const d = new Date(iso);
  const opts = { year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' };
  return isNaN(d) ? iso : new Intl.DateTimeFormat(undefined, opts).format(d);
}

function render(){
  const now = new Date();
  const upcoming = [];
  const past = [];

  EVENTS.forEach(ev=>{
    const d = new Date(ev.date);
    if(!isNaN(d) && d >= now){ upcoming.push(ev); } else { past.push(ev); }
  });

  upcoming.sort((a,b)=> new Date(a.date) - new Date(b.date));
  past.sort((a,b)=> new Date(b.date) - new Date(a.date));

  const makeCard = (ev,isUpcoming) => {
    const when = formatDate(ev.date);
    const tag = isUpcoming ? 'Upcoming' : 'Past';
    const link = ev.link ? `<a href="${ev.link}" target="_blank" rel="noopener" class="tag">Details</a>` : `<span class="tag">${tag}</span>`;
    return `
      <article class="card">
        <h4>${ev.title}</h4>
        <div class="meta">${when} • ${ev.venue}${ev.city ? ` — ${ev.city}` : ''}</div>
        <div>${link}</div>
      </article>
    `;
  };

  upcomingEl.innerHTML = upcoming.length ? upcoming.map(e=>makeCard(e,true)).join("") : `<p class="meta">No upcoming events yet — stay tuned.</p>`;
  pastEl.innerHTML = past.length ? past.map(e=>makeCard(e,false)).join("") : `<p class="meta">No past events yet.</p>`;
}

render();
