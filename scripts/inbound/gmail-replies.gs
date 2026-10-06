/**
 * The reply mailbox feed, for a Gmail or Google Workspace mailbox.
 *
 * WHAT IT DOES. Every five minutes it finds new mail in the reply mailbox,
 * posts each message's sender and Message-ID to the site, and labels the
 * thread so it is not posted twice. It also posts a heartbeat on every run.
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
 *      five-minute trigger and the label.
 *   4. Run `run` once by hand. The site's /craft/admin/comms page should then
 *      show the reply feed as having posted.
 *
 * Auto-replies (out of office) count as replies. That is deliberate: a pause
 * a person reviews costs nothing, and a missed real reply costs trust.
 */

var LABEL = 'lc-reply-posted';
var SOURCE = 'gmail';

function setup() {
  if (!GmailApp.getUserLabelByName(LABEL)) GmailApp.createLabel(LABEL);
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

  var label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  var threads = GmailApp.search('to:' + mailbox + ' newer_than:7d -label:' + LABEL + ' -in:sent', 0, 50);

  threads.forEach(function (thread) {
    var allPosted = true;
    thread.getMessages().forEach(function (message) {
      var from = message.getFrom();
      if (from.toLowerCase().indexOf(mailbox) !== -1) return; // our own message in the thread
      var ok = post_(endpoint, secret, {
        kind: 'reply',
        source: SOURCE,
        messageId: message.getHeader('Message-ID') || message.getId(),
        from: from,
        receivedAt: message.getDate().toISOString(),
      });
      if (!ok) allPosted = false;
    });
    // Only a thread whose every message was accepted is labelled. A failure
    // is tried again on the next run; the site ignores a repeat.
    if (allPosted) thread.addLabel(label);
  });

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
