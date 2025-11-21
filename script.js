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
  // Single event: Pizza Pop Up
  {
    title: "Coffee Shop DJ Pop-Up",
    date: "2025-12-13T13:00",
    venue: "Haraz Coffee House",
    city: "New Brunswick, NJ",
    link: "https://www.flite.city/e/haraz-coffee-house-dj-pop-up-001",
    flyer: "assets/HarazCoffeeFlyer1.png", 
    description: "Cuesic is bringing the energy to Haraz Coffee House for New Brunswick's first ever Coffee Shop DJ Pop-Up!\n\nCome enjoy fresh music, good vibes, and your favorite drinks right here in your own city!\n\nWhy go to NYC or Philly for a Coffee Rave when we are bringing it right to YOU!?!\n\n Grab your <strong class=\"brand-strong\">FREE</strong> ticket and enjoy <strong class=\"brand-strong\">15% off</strong> all your purchases when you show your QR code at checkout!"
  }
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

  EVENTS.forEach((ev, idx) => {
    const d = new Date(ev.date);
    if(!isNaN(d) && d >= now){ upcoming.push({ ev, idx }); } else { past.push({ ev, idx }); }
  });

  upcoming.sort((a,b)=> new Date(a.ev.date) - new Date(b.ev.date));
  past.sort((a,b)=> new Date(b.ev.date) - new Date(a.ev.date));

  const makeCard = (ev,isUpcoming,idx) => {
    const when = formatDate(ev.date);
    return `
      <article class="card">
        <h4>${ev.title}</h4>
        <div class="meta">${when} • ${ev.venue}${ev.city ? ` — ${ev.city}` : ''}</div>
        <div>
          <button class="details-btn" data-index="${idx}" aria-haspopup="dialog">Details</button>
        </div>
      </article>
    `;
  };

  upcomingEl.innerHTML = upcoming.length ? upcoming.map(item=>makeCard(item.ev,true,item.idx)).join("") : `<p class="meta">No upcoming events yet — stay tuned.</p>`;
  pastEl.innerHTML = past.length ? past.map(item=>makeCard(item.ev,false,item.idx)).join("") : `<p class="meta">No past events yet.</p>`;
}

render();

/* Modal behavior for event details */
const modal = document.getElementById('event-modal');
const modalOverlay = modal?.querySelector('.modal-overlay');
const modalClose = modal?.querySelector('.modal-close');
const modalTitle = document.getElementById('event-title');
const modalDesc = document.getElementById('event-desc');
modalDesc.style.whiteSpace = 'pre-line';
const modalMeta = document.getElementById('event-meta');
const modalFlyer = document.getElementById('modal-flyer');
const modalTicket = document.getElementById('event-ticket');

function openModalFor(idx){
  const ev = EVENTS[idx];
  if(!ev) return;
  modalTitle.textContent = ev.title;
  // render description as HTML so <strong> tags work, and preserve newlines
  modalDesc.innerHTML = (ev.description || '').replace(/\n/g, '<br>');
  modalMeta.textContent = `${formatDate(ev.date)} • ${ev.venue}${ev.city ? ` — ${ev.city}` : ''}`;
  if(ev.flyer){ modalFlyer.src = ev.flyer; modalFlyer.alt = ev.title + ' flyer'; modalFlyer.style.display = 'block'; }
  else { modalFlyer.style.display = 'none'; }
  if(ev.link){ modalTicket.href = ev.link; modalTicket.style.display = 'inline-block'; }
  else { modalTicket.style.display = 'none'; }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden','false');
  // focus the close button for accessibility
  modalClose?.focus();
}

function closeModal(){
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden','true');
}

// Delegate clicks on details buttons
document.addEventListener('click', (e)=>{
  const btn = e.target.closest && e.target.closest('.details-btn');
  if(btn){ const idx = btn.getAttribute('data-index'); openModalFor(idx); }
  if(e.target.closest && e.target.closest('[data-close]')){ closeModal(); }
});

// close handlers
modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', closeModal);
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });
