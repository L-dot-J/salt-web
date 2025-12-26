// Small helper script for the site
document.addEventListener('DOMContentLoaded', function(){
  // Fill the current year in footers
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if(el) el.textContent = y;
  var el2 = document.getElementById('year-contact');
  if(el2) el2.textContent = y;

  // Add a click handler to the logo(s) to ensure they go to landing page
  var logos = document.querySelectorAll('.logo');
  logos.forEach(function(l){
    l.addEventListener('click', function(e){
      // let the normal link behavior occur; this ensures accessibility
    });
  });

  // Optionally highlight active nav link based on current pathname
  var links = document.querySelectorAll('.main-nav a');
  links.forEach(function(a){
    if(location.pathname.endsWith(a.getAttribute('href')) || (location.pathname === '/' && a.getAttribute('href') === 'index.html')){
      a.classList.add('active');
    }
  });
});

// --- Custom cursor + sprinkle effect ---
(function(){
  if(!document.body) return;
  var path = location.pathname || '';
  var isLanding = path === '/salt-web/' || path.endsWith('/salt-web/index.html');

  // Only enable cursor/sprinkle on landing page
  if(!isLanding) return;

  // mark body so CSS hides native cursor only on landing
  document.body.classList.add('landing-enabled');

  // Create pile container for collected salt
  var pile = document.createElement('div'); pile.id = 'salt-pile'; document.body.appendChild(pile);
  var bucketCounts = {}; // simple bucket map for stacking
  var bucketWidth = 8; // pixels per stack bucket

  // Create custom cursor element
  var cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  // try to use provided logo image; fallback to emoji
  var img = document.createElement('img');
  // Prefer the logo in the public folder if present; fall back to project images and then emoji
  img.src = 'public/logo.png';
  img.alt = 'logo';
  img.style.height = '80px';
  // If public/logo.png fails, try common alternatives, then fall back to emoji
  img.onload = function(){ cursor.appendChild(img); };
  img.onerror = function tryFallback(){
    // avoid infinite loops
    img.onerror = null;
    // try png in public, then images folder
    var tries = ['public/logo.png','public/logo.png','images/logo-upside-down.png','images/logo.png'];
    var i = 0;
    function tryNext(){
      if(i>=tries.length){ var e = document.createElement('div'); e.className='emoji'; e.textContent='🧂'; cursor.appendChild(e); return; }
      img.src = tries[i++];
      // if it still errors, this handler will run again and try next
      img.onerror = tryNext;
    }
    tryNext();
  };
  document.body.appendChild(cursor);

  var mouseX = 0, mouseY = 0;
  var curX = 0, curY = 0;
  var raf;
  var lastPointerType = 'mouse';

  // Use pointer events so touch works too. Fallback to mouse/touch events for older browsers.
  function handlePointerMove(e){
    lastPointerType = e.pointerType || (e.touches ? 'touch' : 'mouse');
    mouseX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || mouseX;
    mouseY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || mouseY;
    if(!raf) raf = requestAnimationFrame(updateCursor);
  }
  if(window.PointerEvent){
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', function(e){ if(!e.target.closest('.site-header')) sprinkle(e.clientX, e.clientY); });
  } else {
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, {passive:true});
    document.addEventListener('touchstart', function(e){ if(!e.target.closest('.site-header')) sprinkle(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
  }

  function updateCursor(){
    raf = null;
    // use slightly different smoothing for touch to feel natural
    var smoothing = (lastPointerType === 'touch') ? 0.42 : 0.22;
    curX += (mouseX - curX) * smoothing;
    curY += (mouseY - curY) * smoothing;
    cursor.style.left = curX + 'px'; cursor.style.top = curY + 'px';
  }

  // Hide custom cursor when over header/menu to let native cursor be used (header has cursor:auto)
  var header = document.querySelector('.site-header');
  if(header){
    header.addEventListener('pointerenter', function(){ cursor.style.display='none'; });
    header.addEventListener('pointerleave', function(){ cursor.style.display='flex'; });
  }

  // Sprinkle particles on click/pointerdown/touch — landing page only
  // Note: pointerdown handler is attached above when PointerEvent is available.
  // Keep a click fallback for mouse users.
  document.addEventListener('click', function(e){ if(e.target.closest('.site-header')) return; sprinkle(e.clientX, e.clientY); });

  function sprinkle(x,y){
    // fewer particles but much slower and farther falling for a deliberate sprinkle
    var count = 12;
    // compute spawn point under the visual cursor (center of .custom-cursor) so particles start directly beneath it
    var cursorRect = cursor.getBoundingClientRect();
    var startX = cursorRect.left + cursorRect.width/2;
    var startY = cursorRect.top + cursorRect.height/2;
    for(var i=0;i<count;i++){
      (function(){
        var p = document.createElement('div'); p.className='salt-particle';
        // lateral range with more downward fall; particles fall a lot farther
        var dx = (Math.random()*260 - 130) + 'px';
        var dy = (Math.random()*900 + 600) + 'px'; // falls a lot further
        var rot = Math.round(Math.random()*80 - 40) + 'deg';
        p.style.setProperty('--dx', dx);
        p.style.setProperty('--dy', dy);
        p.style.setProperty('--rot', rot);
        // position particle at the center of the custom cursor so it appears under the cursor
        p.style.left = startX + 'px'; p.style.top = startY + 'px';
        // make duration much longer (5s - 11s) to slow the fall considerably
        p.style.animationDuration = (5000 + Math.random()*6000) + 'ms';
        // ensure the timing function is smooth for slow motion
        p.style.animationTimingFunction = 'cubic-bezier(.02,.6,.2,1)';
        document.body.appendChild(p);

        // Append pile grain earlier than animation end so pile appears faster.
        // We'll schedule an early append at ~40% of the particle duration (or at least 300ms).
        var dur = parseFloat(p.style.animationDuration) || 5000;
  var earlyTime = Math.max(300, Math.round(dur * 0.25));
        var appended = false;
        var earlyTimer = setTimeout(function(){
          if(appended) return;
          try{
            var rectMid = p.getBoundingClientRect();
            var finalXmid = rectMid.left + rectMid.width/2;
            var bucketMid = Math.floor(finalXmid / bucketWidth);
            var stackIndexMid = bucketCounts[bucketMid] || 0;
            var grainMid = document.createElement('div'); grainMid.className='salt-grain';
            grainMid.style.left = (finalXmid - 3) + 'px';
            grainMid.style.bottom = (stackIndexMid * 4) + 'px';
            pile.appendChild(grainMid);
            bucketCounts[bucketMid] = stackIndexMid + 1;
            appended = true;
          }catch(e){ /* ignore */ }
        }, earlyTime);

        // when animation ends, ensure we append if not yet appended, then clean up
        p.addEventListener('animationend', function(){
          clearTimeout(earlyTimer);
          if(!appended){
            try{
              var rect = p.getBoundingClientRect();
              var finalX = rect.left + rect.width/2;
              var bucket = Math.floor(finalX / bucketWidth);
              var stackIndex = bucketCounts[bucket] || 0;
              var grain = document.createElement('div'); grain.className='salt-grain';
              grain.style.left = (finalX - 3) + 'px';
              var bottomOffset = stackIndex * 4; // 4px per grain
              grain.style.bottom = bottomOffset + 'px';
              pile.appendChild(grain);
              bucketCounts[bucket] = stackIndex + 1;
              appended = true;
            }catch(err){ /* fallback */ }
          }
          p.remove();
        });
      })();
    }
  }
})();
