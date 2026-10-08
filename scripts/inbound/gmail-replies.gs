/**
 * The reply mailbox feed, for a Gmail or Google Workspace mailbox.
 *
 * WHAT IT DOES. Every five minutes it finds new mail in the reply mailbox and
 * posts each message's sender and Message-ID to the site. It also posts a
 * heartbeat on every run.
 * The site holds every marketing email while the heartbeat is older than
 * 30 minutes, so if this script stops, sending pauses rather than carrying on
 * blind.
 *
 * WHAT IT NEVER SENDS. Not the subject, not the body, not attachments. Only
 * the sender's address, the Message-ID and the time it arrived.
 *
 * SETUP (once, by the owner of the reply mailbox):
 *   1. Open https://script.google.com while signed in as the reply mailbox
 *      account. New project. Paste this file in. Save.
 *   2. Project Settings → Script properties. Add three:
 *        LC_ENDPOINT  https://learning.thelivingcraft.ai/api/comms/inbound
 *        LC_SECRET    the same value as COMMS_INBOUND_SECRET in Vercel
 *        LC_MAILBOX   the reply address, e.g. hello@thelivingcraft.ai
 *   3. Run `setup` once from the editor and accept the permissions it asks
 *      for (read Gmail, connect to an external service). It creates the
 *      five-minute trigger.
 *   4. Run `run` once by hand. The site's /craft/admin/comms page should then
 *      show the reply feed as having posted.
 *
 * Auto-replies (out of office) count as replies. That is deliberate: a pause
 * a person reviews costs nothing, and a missed real reply costs trust.
 */

/*
 * WHY A TIME CURSOR AND NOT A LABEL. Until 8 October this labelled each
 * thread once posted and searched with -label:. Gmail labels belong to a
 * thread, not to a message, so the second reply in a labelled thread was
 * never seen: a person answered twice and kept receiving the sequence.
 *
 * Now the script keeps one time, LC_CURSOR in Script properties. Each run
 * reads every message newer than the cursor minus OVERLAP_MS, posts it, and
 * moves the cursor forward. The overlap catches mail Gmail indexes late. A
 * message posted twice is harmless: the site records a Message-ID once and
 * answers a repeat with 200 'duplicate'.
 *
 * The cursor never moves past a message whose post failed, so that message
 * is tried again next run. It never falls further back than MAX_LOOKBACK_MS.
 */
var SOURCE = 'gmail';
var CURSOR = 'LC_CURSOR';
var OVERLAP_MS = 15 * 60 * 1000;
var MAX_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
var PAGE = 50;
var MAX_THREADS = 500;

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'run') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('run').timeBased().everyMinutes(5).create();
}

function run() {
  var props = PropertiesService.getScriptProperties();
  var endpoint = props.getProperty('LC_ENDPOINT');
  var secret = props.getProperty('LC_SECRET');
  var mailbox = (props.getProperty('LC_MAILBOX') || '').toLowerCase();
  if (!endpoint || !secret || !mailbox) throw new Error('Set LC_ENDPOINT, LC_SECRET and LC_MAILBOX in Script properties.');

  var startedAt = Date.now();
  var cursor = Number(props.getProperty(CURSOR)) || 0;
  var from = Math.max(cursor - OVERLAP_MS, startedAt - MAX_LOOKBACK_MS);
  var query = 'to:' + mailbox + ' after:' + Math.floor(from / 1000) + ' -in:sent';

  // The earliest message that failed to post. The cursor stops there.
  var firstFailure = null;
  for (var offset = 0; offset < MAX_THREADS; offset += PAGE) {
    var threads = GmailApp.search(query, offset, PAGE);
    threads.forEach(function (thread) {
      thread.getMessages().forEach(function (message) {
        var at = message.getDate().getTime();
        if (at < from) return; // an older message in a thread with new activity
        var sender = message.getFrom();
        if (sender.toLowerCase().indexOf(mailbox) !== -1) return; // our own message in the thread
        var ok = post_(endpoint, secret, {
          kind: 'reply',
          source: SOURCE,
          messageId: message.getHeader('Message-ID') || message.getId(),
          from: sender,
          receivedAt: message.getDate().toISOString(),
        });
        if (!ok && (firstFailure === null || at < firstFailure)) firstFailure = at;
      });
    });
    if (threads.length < PAGE) break;
  }

  props.setProperty(CURSOR, String(firstFailure === null ? startedAt : firstFailure));
  post_(endpoint, secret, { kind: 'heartbeat', source: SOURCE });
}

function post_(endpoint, secret, body) {
  var raw = JSON.stringify(body);
  var ts = String(Math.floor(Date.now() / 1000));
  var mac = Utilities.computeHmacSha256Signature(ts + '.' + raw, secret, Utilities.Charset.UTF_8);
  var res = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: raw,
    headers: { 'X-LC-Timestamp': ts, 'X-LC-Signature': 'v1=' + Utilities.base64Encode(mac) },
    muteHttpExceptions: true,
  });
  return res.getResponseCode() === 200;
}
