(function(){
  // mobile menu
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');
  function closeMenu(){ mobile.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', function(){
    var open = mobile.hidden;
    mobile.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
  mobile.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  window.addEventListener('resize', function(){ if (window.innerWidth > 520) closeMenu(); });
})();

(function(){
  var QUOTE_API = "https://themethodhome-reviews.the-method-home.workers.dev";
  var form = document.getElementById('quoteForm'), done = document.getElementById('done');
  var space = document.getElementById('space'), msg = document.getElementById('quoteMsg');
  var btn = document.getElementById('submitBtn');
  var tq = document.getElementById('tabQuote'), ta = document.getElementById('tabAsk');
  var mode = 'quote';

  function setMode(m){
    mode = m;
    tq.setAttribute('aria-selected', String(m === 'quote'));
    ta.setAttribute('aria-selected', String(m === 'ask'));
    document.querySelectorAll('.quote-only').forEach(function(el){ el.hidden = m !== 'quote'; });
    document.getElementById('msgLabel').textContent = m === 'quote' ? 'Tell us about the space' : 'Your question';
    btn.textContent = m === 'quote' ? 'Send Request' : 'Send Question';
    document.getElementById('message').required = m === 'ask';
  }
  tq.addEventListener('click', function(){ setMode('quote'); });
  ta.addEventListener('click', function(){ setMode('ask'); });

  document.querySelectorAll('[data-space]').forEach(function(el){
    el.addEventListener('click', function(){
      setMode('quote');
      form.hidden = false; done.hidden = true;
      space.value = el.getAttribute('data-space');
    });
  });

  function showMsg(text){ msg.textContent = text; msg.hidden = false; }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    msg.hidden = true;
    var loc = document.getElementById('location').value;
    if (!loc){ showMsg('Please choose New York City or Orlando, FL.'); return; }
    var ts = form.querySelector('[name="cf-turnstile-response"]');
    var name = document.getElementById('name').value;
    var payload = {
      name: name,
      email: document.getElementById('email').value,
      phone: mode === 'quote' ? document.getElementById('phone').value : '',
      location: loc,
      spaceType: mode === 'quote' ? space.value : 'Quick question',
      message: document.getElementById('message').value,
      website: document.getElementById('quoteWebsite').value,
      turnstileToken: ts ? ts.value : ''
    };
    btn.disabled = true;
    fetch(QUOTE_API + '/api/quote', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      .then(function(res){ return res.json().then(function(data){ return {ok: res.ok, data: data}; }); })
      .then(function(r){
        btn.disabled = false;
        if (!r.ok){
          showMsg(r.data.error || 'That didn’t go through. Please try again, or email us directly.');
          if (window.turnstile) try { window.turnstile.reset(); } catch(e){}
          return;
        }
        var inbox = loc === 'NY' ? 'InfoNY@themethodhome.com' : 'InfoFL@themethodhome.com';
        var first = name.trim().split(/\s+/)[0] || 'there';
        document.getElementById('doneTitle').textContent = mode === 'quote' ? 'Request received.' : 'Question received.';
        document.getElementById('doneText').textContent = 'Thanks, ' + first + '. Here’s what happens next:';
        document.getElementById('doneSteps').innerHTML = mode === 'quote'
          ? '<li>Watch for an email from <strong>' + inbox + '</strong> within one business day.</li><li>We’ll set up your free walkthrough.</li><li>You’ll get a fixed quote after the visit.</li>'
          : '<li>Watch for an answer from <strong>' + inbox + '</strong> within one business day.</li><li>If a quote makes sense, we’ll offer a walkthrough time.</li>';
        form.hidden = true; done.hidden = false;
        if (window.gtag) gtag('event', 'generate_lead', {form: mode, location: loc});
      })
      .catch(function(){
        btn.disabled = false;
        showMsg('That didn’t go through. Please try again, or email us directly.');
      });
  });

  document.getElementById('againBtn').addEventListener('click', function(){
    form.reset(); setMode(mode);
    if (window.turnstile) try { window.turnstile.reset(); } catch(e){}
    form.hidden = false; done.hidden = true;
  });

  var bar = document.getElementById('mobileBar'), contact = document.getElementById('contact');
  if (bar && contact && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){ bar.classList.toggle('is-hidden', en[0].isIntersecting); }, {threshold:.15}).observe(contact);
  }
})();

(function(){
  var list = document.getElementById('homeReviewList');
  if (!list) return;
  function esc(s){ var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  var star = '<polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63"/>';
  fetch('reviews.json', {cache:'no-store'})
    .then(function(res){ return res.json(); })
    .then(function(reviews){
      if (!reviews || !reviews.length) return;
      list.className = 'review-grid';
      list.innerHTML = reviews.slice(0, 3).map(function(r){
        var stars = '';
        for (var i = 1; i <= 5; i++) stars += '<svg viewBox="0 0 24 24"' + (i <= r.rating ? '' : ' class="empty"') + '>' + star + '</svg>';
        var loc = r.location === 'FL' ? 'Orlando, FL' : 'New York, NY';
        return '<div class="review-card"><div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + stars + '</div>' +
          '<p class="review-text clamp">' + esc(r.text) + '</p>' +
          '<button type="button" class="read-more" hidden>Read more</button>' +
          '<p class="review-meta">' + esc(r.name) + ' &middot; ' + loc + '</p></div>';
      }).join('');
      list.querySelectorAll('.review-card').forEach(function(card){
        var p = card.querySelector('.review-text'), b = card.querySelector('.read-more');
        if (p.scrollHeight > p.clientHeight + 2){
          b.hidden = false;
          b.addEventListener('click', function(){
            var open = p.classList.toggle('clamp');
            b.textContent = open ? 'Read more' : 'Show less';
          });
        }
      });
      document.getElementById('reviewCtas').hidden = false;
    })
    .catch(function(){});
})();
(function(){
  var art = document.getElementById('closetArt');
  var status = document.getElementById('closetStatus');
  var step = document.getElementById('closetStep');
  if (!art || !status || !step) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var steps = [[0, 'Measuring the space'], [700, 'Hanging what you wear'], [1600, 'Folding and stacking'], [2500, 'Bins, drawers and shoes'], [3400, 'Labeling every zone'], [4300, 'Everything in its place']];
  var timers = [];
  function play(){
    timers.forEach(clearTimeout); timers = [];
    art.classList.add('reset');
    status.classList.add('working');
    void art.getBoundingClientRect();
    requestAnimationFrame(function(){ art.classList.remove('reset'); });
    steps.forEach(function(s, i){
      timers.push(setTimeout(function(){
        step.textContent = s[1];
        status.classList.toggle('working', i < steps.length - 1);
      }, s[0]));
    });
    timers.push(setTimeout(play, 9000));
  }
  var started = false;
  function start(){ if (!started){ started = true; play(); } }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ if (en[0].isIntersecting) start(); }, {threshold:.3}).observe(art);
  } else { start(); }
})();
