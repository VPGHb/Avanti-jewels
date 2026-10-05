// No analytics, advertising pixels, third-party embeds or network submissions.
(() => {
  const key = 'avanti-privacy-choice-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && typeof saved.memory === 'boolean' && saved.expires > Date.now()) choice = saved;
    else if (saved) localStorage.removeItem(key);
  } catch {}
  window.avantiPrivacy = { memoryAllowed: () => choice?.memory === true };
  let notice;
  function show() { notice.hidden = false; }
  function decide(memory) {
    choice = { memory, expires: Date.now() + lifetime };
    try { localStorage.setItem(key, JSON.stringify(choice)); } catch {}
    if (!memory) {
      try {
        for (const name of ['avanti-catalog-position','avanti-catalog-return','avanti-photo-navigation']) sessionStorage.removeItem(name);
      } catch {}
      // Restore ordinary links if someone changes their preference on a detail page.
      document.querySelectorAll('a[data-catalog-resume]').forEach(a => { a.href = a.dataset.catalogResume; });
    }
    notice.hidden = true;
    const settings = document.querySelector('[data-privacy-settings]');
    settings?.focus({ preventScroll: true });
  }
  document.addEventListener('DOMContentLoaded', () => {
    notice = document.createElement('section');
    notice.className = 'privacy-notice';
    notice.setAttribute('aria-label', 'Cookie and privacy preferences');
    notice.innerHTML = `<h2>Your browsing preferences</h2><p>No advertising or analytics trackers are installed. Allow optional tab memory to resume your shopping position and improve image transitions, or browse without it. Your choice is remembered on this device for 180 days.</p><div class="privacy-actions"><button type="button" data-memory="yes">Allow browsing memory</button><button type="button" data-memory="no">Reject optional storage</button><a href="/cookies.html">Cookie policy</a></div>`;
    notice.hidden = choice !== null;
    document.body.appendChild(notice);
    const footer = document.querySelector('.shop-footer nav');
    if (footer) {
      const link = document.createElement('a');
      link.href = '/cookies.html'; link.textContent = 'Cookie policy'; footer.appendChild(link);
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.privacySettings = ''; button.textContent = 'Privacy preferences'; footer.appendChild(button);
    }
    if (document.querySelector('link[rel="canonical"]')) {
      const schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({ '@context':'https://schema.org', '@graph': [
        { '@type':'Organization', '@id':'https://avantijewels.com/#organization', name:'Avanti Jewels', url:'https://avantijewels.com/', telephone:'+17186979678', email:'avantijewelsny@gmail.com', areaServed:{'@type':'City',name:'Hicksville, New York'} },
        { '@type':'WebSite', '@id':'https://avantijewels.com/#website', url:'https://avantijewels.com/', name:'Avanti Jewels', publisher:{'@id':'https://avantijewels.com/#organization'} }
      ] });
      document.head.appendChild(schema);
    }
    document.addEventListener('click', event => {
      const settings = event.target.closest?.('[data-privacy-settings]');
      if (settings) { show(); notice.querySelector('button')?.focus({preventScroll:true}); }
      const button = event.target.closest?.('[data-memory]');
      if (button) decide(button.dataset.memory === 'yes');
    });
  });
  // Capture image failures without inline JavaScript, compatible with script CSP.
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.original || image.dataset.fallbackUsed) return;
    image.dataset.fallbackUsed = 'true';
    image.removeAttribute('srcset'); image.src = image.dataset.original;
  }, true);
})();
