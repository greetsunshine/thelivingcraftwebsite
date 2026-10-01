// The script every week 2 instructor page embeds, inside a <script> tag.
//
// It does two things: the Side-by-side toggle, and lighting the reference card
// that backs whichever beat you clicked. It lives here because it is embedded
// in seven published pages and a fix that exists only inside published HTML is
// a fix nobody can find.
//
// THE BUG IT FIXES. An earlier version did
// `document.querySelector(beat.getAttribute('data-ref'))` while the markup
// holds a bare id. querySelector read "r-payonce" as an element name, matched
// nothing, returned null, and the handler bailed — so clicking a beat did
// nothing at all, on every page, silently. Nothing in check:teaching sees this,
// because a dead link and a working one are the same HTML.
//
// It also has to work on the collated page, where six topics each have their
// own reference column, so the scroll target is the nearest .pane-ref rather
// than the only one.

(function () {
  var body = document.body;
  var btn = document.getElementById('splitbtn');
  var beats = [].slice.call(document.querySelectorAll('.beat[data-ref]'));
  var wide = matchMedia('(min-width:1200px)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* data-ref holds a bare id. An earlier version of this script passed it
     straight to querySelector, which read it as an element name, matched
     nothing and silently did nothing on every click. Strip a leading # so
     both spellings work. */
  function cardFor(beat) {
    var ref = (beat.getAttribute('data-ref') || '').replace(/^#/, '');
    return ref ? document.getElementById(ref) : null;
  }

  /* The nearest reference column, because a collated page has six of them. */
  function paneFor(el) {
    return el ? el.closest('.pane-ref') : null;
  }

  function lightUp(beat) {
    var card = cardFor(beat);
    if (!card) return;
    var pane = paneFor(card);
    var scope = pane || document;
    var was = scope.querySelector('.card.lit');
    if (was) was.classList.remove('lit');
    card.classList.add('lit');

    var here = document.querySelector('.beat.here');
    if (here && here !== beat) here.classList.remove('here');
    beat.classList.add('here');

    var behaviour = reduce ? 'auto' : 'smooth';
    if (pane && body.classList.contains('split') && wide.matches &&
        pane.scrollHeight > pane.clientHeight) {
      var top = card.getBoundingClientRect().top
              - pane.getBoundingClientRect().top + pane.scrollTop;
      pane.scrollTo({ top: Math.max(0, top - 8), behavior: behaviour });
    } else {
      card.scrollIntoView({ behavior: behaviour, block: 'start' });
    }
  }

  beats.forEach(function (beat) {
    beat.addEventListener('click', function (e) {
      if (e.target.closest('a, summary, button, pre, code')) return;
      lightUp(beat);
    });
  });

  function setSplit(on) {
    body.classList.toggle('split', on);
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) {
      [].forEach.call(document.querySelectorAll('.card.lit'), function (c) {
        c.classList.remove('lit');
      });
    }
  }
  if (btn) {
    btn.addEventListener('click', function () {
      setSplit(!body.classList.contains('split'));
    });
  }
  setSplit(wide.matches);
})();
