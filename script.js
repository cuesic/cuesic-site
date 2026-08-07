/* Mobile menu toggle */
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

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
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- EVENTS DATA ---- */
const EVENTS = [
  {
    title: "Coffee Shop DJ Pop-Up",
    date: "2025-12-13T13:00",
    venue: "Haraz Coffee House",
    city: "New Brunswick, NJ",
    link: "https://www.flite.city/e/haraz-coffee-house-dj-pop-up-001",
    flyer: "assets/HarazCoffeeFlyer1.png",
    description: "Cuesic is bringing the energy to Haraz Coffee House for New Brunswick's first ever Coffee Shop DJ Pop-Up!\n\nCome enjoy fresh music, good vibes, and your favorite drinks right here in your own city!\n\nWhy go to NYC or Philly for a Coffee Rave when we are bringing it right to YOU!?!\n\n Grab your <strong class=\"brand-strong\">FREE</strong> ticket and enjoy <strong class=\"brand-strong\">15% off</strong> all your purchases when you show your QR code at checkout!"
  },
  {
    title: "Galentine's Day Bites & Beats",
    date: "2026-02-12T22:00",
    venue: "Fat Cactus",
    city: "New Brunswick, NJ",
    link: "https://flite.city/e/galentines-day-bites-and-beats-001",
    flyer: "assets/FatCactusFlyerOnline.png",
    description: "Cuesic is bringing the energy to Fat Cactus Cantina for a night of great music, great food and great drinks!\n\nCome enjoy fresh music, good vibes, and your favorite Mexican food and drinks right here in your own city!\n\nWhy go to NYC or Philly for an EDM event when we are bringing it right to YOU!?!\n\nGrab your <strong style=\"color: #cb6ce6\">FREE</strong> ticket and enjoy <strong style=\"color: #cb6ce6\">20% off ALL</strong> your purchases when you show your valid RUID at checkout!"
  },
  {
    title: "St. Patty's Day Pregame",
    date: "2026-03-05T20:00",
    venue: "Fat Cactus",
    city: "New Brunswick, NJ",
    link: "https://doorlist.app/e/umPkj0m?s=L53Fb4VZWl",
    flyer: "assets/STPattiesFlyer.png",
    description: "Join Cuesic for a St. Patty's Day pregame kickoff at Fat Cactus Cantina New Brunswick!\n\nCome enjoy house music, delicious food, and strong drinks in your very own city!\n\nIt's a Thursday so join us to <strong style=\"color: #cb6ce6\">PREGAME</strong> before you hit the town and sit down for delicious food and drinks!\n\nFREE RSVP and enjoy <strong style=\"color: #cb6ce6\">20% OFF ALL FOOD</strong> when you show your RUID to the server!\n\nWe can't wait to celebrate St. Patty's Day with you!"
  },
  {
    title: "Boiler Room at Pitch Social",
    date: "2026-04-18T22:00",
    venue: "PITCH SOCIAL",
    city: "New Brunswick, NJ",
    link: "",
    flyer: "assets/detailscomingsoon.svg",
    description: "Stay tuned for more details on the biggest BOILER ROOM event in New Brunswick!\n\n We are bringing the energy and you DON'T want to miss it!"
  },
  {
    title: "EDM Pregame at Fat Cactus - New Brunswick",
    date: "2026-04-23T16:00",
    venue: "Fat Cactus",
    city: "New Brunswick, NJ",
    link: "",
    flyer: "assets/detailscomingsoon.svg",
    description: "Cuesic is bringing the energy to Fat Cactus Cantina for a night of great music, great food and great drinks!\n\nCome enjoy fresh music, good vibes, and your favorite Mexican food and drinks right here in your own city!\n\nWhy go to NYC or Philly for an EDM event when we are bringing it right to YOU!?!\n\nGrab your <strong style=\"color: #cb6ce6\">FREE</strong> ticket and enjoy <strong style=\"color: #cb6ce6\">20% off ALL</strong> your purchases when you show your valid RUID at checkout!"
  },
];

/* Render events — only runs on pages that have #upcoming and #past */
const upcomingEl = document.getElementById('upcoming');
const pastEl = document.getElementById('past');

function formatDate(iso){
  const d = new Date(iso);
  const opts = { year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' };
  return isNaN(d) ? iso : new Intl.DateTimeFormat(undefined, opts).format(d);
}

function render(){
  if(!upcomingEl || !pastEl) return;
  const now = new Date();
  const upcoming = [], past = [];
  EVENTS.forEach((ev, idx) => {
    const d = new Date(ev.date);
    if(!isNaN(d) && d >= now){ upcoming.push({ev,idx}); } else { past.push({ev,idx}); }
  });
  upcoming.sort((a,b)=> new Date(a.ev.date) - new Date(b.ev.date));
  past.sort((a,b)=> new Date(b.ev.date) - new Date(a.ev.date));
  const makeCard = (ev,idx) => `
    <article class="card">
      <h4>${ev.title}</h4>
      <div class="meta">${formatDate(ev.date)} • ${ev.venue}${ev.city ? ` — ${ev.city}` : ''}</div>
      <div><button class="details-btn" data-index="${idx}" aria-haspopup="dialog">Details</button></div>
    </article>`;
  upcomingEl.innerHTML = upcoming.length ? upcoming.map(i=>makeCard(i.ev,i.idx)).join('') : `<p class="meta">No upcoming events yet — stay tuned.</p>`;
  pastEl.innerHTML    = past.length    ? past.map(i=>makeCard(i.ev,i.idx)).join('')    : `<p class="meta">No past events yet.</p>`;
}
render();

/* Event modal — only runs on pages that have #event-modal */
const modal = document.getElementById('event-modal');
if(modal){
  const modalOverlay = modal.querySelector('.modal-overlay');
  const modalClose   = modal.querySelector('.modal-close');
  const modalTitle   = document.getElementById('event-title');
  const modalDesc    = document.getElementById('event-desc');
  const modalMeta    = document.getElementById('event-meta');
  const modalFlyer   = document.getElementById('modal-flyer');
  const modalTicket  = document.getElementById('event-ticket');
  if(modalDesc) modalDesc.style.whiteSpace = 'pre-line';

  function openModalFor(idx){
    const i = typeof idx === 'string' ? parseInt(idx,10) : idx;
    if(isNaN(i) || i < 0 || i >= EVENTS.length) return;
    const ev = EVENTS[i];
    if(!ev) return;
    if(modalTitle) modalTitle.textContent = ev.title;
    if(modalDesc)  modalDesc.innerHTML = (ev.description||'').replace(/\n/g,'<br>');
    if(modalMeta)  modalMeta.textContent = `${formatDate(ev.date)} • ${ev.venue}${ev.city?` — ${ev.city}`:''}`;
    if(modalFlyer){ modalFlyer.src = ev.flyer||''; modalFlyer.alt = ev.title+' flyer'; modalFlyer.style.display = ev.flyer ? 'block' : 'none'; }
    const isPast = !isNaN(new Date(ev.date)) && new Date(ev.date) < new Date();
    if(modalTicket){ modalTicket.href = ev.link||'#'; modalTicket.style.display = (ev.link && !isPast) ? 'inline-block' : 'none'; }
    modal.classList.add('active');
    modal.setAttribute('aria-hidden','false');
    modalClose?.focus();
  }

  function closeModal(){
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden','true');
  }

  document.addEventListener('click', e=>{
    const btn = e.target.closest?.('.details-btn');
    if(btn){ openModalFor(btn.getAttribute('data-index')); }
    if(e.target.closest?.('[data-close]')){ closeModal(); }
  });
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
}
