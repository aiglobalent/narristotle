// Gazette signup: writes the reader's email to Firestore.
//
// Collection: newsletter_subscribers. Public create-only (rules enforce an
// email shape and exactly three fields); the list is editors-only, no
// public read. No key, no backend, no third-party list. The welcome email
// is a separate step: it needs a server-side sending key (Resend), which
// does not exist yet — the in-page confirmation below is the acknowledgment
// until then.
(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;
  var input = document.getElementById('newsletter-email');
  var note = document.getElementById('newsletter-note');
  function say(msg) { if (note) note.textContent = msg; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (input.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      say('That email doesn\u2019t look right \u2014 check it and try again.');
      input.focus();
      return;
    }
    var btn = form.querySelector('button');
    btn.disabled = true;
    say('Signing you up\u2026');
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.NARRISTOTLE_FIREBASE_CONFIG);
      firebase.firestore().collection('newsletter_subscribers').add({
        email: email,
        source: 'homepage',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        form.innerHTML = '<p><strong>You\u2019re in.</strong> Two dispatches a week, Tuesdays and Fridays. The first one finds you.</p>';
      }).catch(function () {
        btn.disabled = false;
        say('Something went wrong saving that \u2014 please try again in a moment.');
      });
    } catch (err) {
      btn.disabled = false;
      say('Something went wrong saving that \u2014 please try again in a moment.');
    }
  });
})();
