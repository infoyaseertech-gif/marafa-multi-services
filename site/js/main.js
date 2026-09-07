// ---------- Header solid-on-scroll ----------
const header = document.getElementById('siteHeader');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('solid', window.scrollY > 40);
  });
}

// ---------- Mobile nav ----------
const burger = document.getElementById('burgerBtn');
const mobileNav = document.getElementById('mobileNav');
const scrim = document.getElementById('scrim');
function closeNav() {
  if (!mobileNav) return;
  mobileNav.classList.remove('open');
  scrim.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}
if (burger) {
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    scrim.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  scrim.addEventListener('click', closeNav);
  mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
}

// ---------- WhatsApp click-to-chat button ----------
(function () {
  const waNumber = "2348109202315"; // +234 810 920 2315, in international format with no + or leading 0
  const waMessage = "Hello Marafa Multi-Services, I'd like to enquire about your services.";
  const fab = document.createElement('a');
  fab.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
  fab.target = "_blank";
  fab.rel = "noopener";
  fab.className = "whatsapp-fab";
  fab.setAttribute("aria-label", "Chat with us on WhatsApp");
  fab.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.6 6.3A8.9 8.9 0 0012 4a8.9 8.9 0 00-7.7 13.4L3 21l3.7-1.2A8.9 8.9 0 0012 21a8.9 8.9 0 006.3-14.7zM12 19.3a7.3 7.3 0 01-3.7-1l-.3-.2-2.5.8.8-2.4-.2-.3A7.3 7.3 0 1119.3 12 7.3 7.3 0 0112 19.3zm4-5.5c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.5.1-.5.7-.6.8-.2.1-.4 0a6 6 0 01-1.8-1.1 6.6 6.6 0 01-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.4.2-.3a.5.5 0 000-.4c-.1-.1-.5-1.2-.7-1.7s-.4-.4-.5-.4h-.4a.9.9 0 00-.6.3 2.7 2.7 0 00-.8 2 4.7 4.7 0 001 2.5 10.6 10.6 0 004.1 3.6c.6.2 1 .4 1.4.5a3.3 3.3 0 001.5.1 2.5 2.5 0 001.6-1.1 2 2 0 00.1-1.1c0-.1-.2-.2-.4-.3z"/></svg>`;
  document.body.appendChild(fab);
})();

// ---------- Contact form -> mailto ----------
const quoteForm = document.getElementById('quoteForm');
if (quoteForm) {
  quoteForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('fname').value.trim();
    const email = document.getElementById('femail').value.trim();
    const service = document.getElementById('fservice').value.trim();
    const message = document.getElementById('fmessage').value.trim();
    const subject = encodeURIComponent('Website Enquiry: ' + (service || 'General Enquiry'));
    const body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Service Needed: ' + service + '\n\n' +
      'Message:\n' + message
    );
    window.location.href = 'mailto:marafa123419@gmail.com?subject=' + subject + '&body=' + body;
  });
}
