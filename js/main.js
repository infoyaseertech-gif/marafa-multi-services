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
