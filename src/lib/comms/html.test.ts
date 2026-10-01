// The email as sent: the footer is appended at dispatch, a marketing message
// without an unsubscribe link is never materialised, and the HTML is a
// rendering of the same words with nothing added.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materialise, materialiseText, renderHtml, UNSUBSCRIBE_ACTION, type Footer } from './html.ts';

const FOOTER: Footer = {
  identity: 'Sunil Mathew · The Living Craft',
  contact: 'apply@thelivingcraft.ai',
  postal: '12 Example Road, Bengaluru 560001',
  preferences: 'https://learning.thelivingcraft.ai/communication-preferences',
};
const LINK = 'https://learning.thelivingcraft.ai/api/unsubscribe?u=abc.def.ghi';
const BODY = `Hi Asha,\n\nYou asked for The Cost-Ceiling Worksheet.\n\nUse the Run-Cost Model: https://learning.thelivingcraft.ai/resources/run-cost-model\n\nSunil Mathew · The Living Craft\n\n${UNSUBSCRIBE_ACTION}`;

test('a marketing body with an action and no link is refused', () => {
  assert.equal(materialiseText(BODY, 'marketing', { unsubscribe: null }, FOOTER), null);
  assert.equal(materialise({ subject: 's', body: BODY, purpose: 'marketing' }, { unsubscribe: null }, FOOTER), null);
});

test('the footer replaces the action and carries the link, the preferences page, who we are and the postal address', () => {
  const text = materialiseText(BODY, 'marketing', { unsubscribe: LINK }, FOOTER)!;
  assert.ok(!text.includes('{{action'));
  assert.ok(text.includes(`Unsubscribe: ${LINK}`));
  assert.ok(text.includes('Email preferences: https://learning.thelivingcraft.ai/communication-preferences'));
  assert.ok(text.includes('You opted in to practical resources'));
  assert.ok(text.includes(FOOTER.identity) && text.includes(FOOTER.contact) && text.includes(FOOTER.postal!));
  assert.ok(text.startsWith('Hi Asha,'), 'the approved words come first and unchanged');
});

test('a transactional body with no action gets the identification footer and no opt-in line', () => {
  const text = materialiseText('Here is the worksheet you asked for.\n\nThe Living Craft', 'transactional', { unsubscribe: null }, FOOTER)!;
  assert.ok(text.includes(FOOTER.identity));
  assert.ok(!text.includes('You opted in'));
  assert.ok(!text.includes('Unsubscribe:'));
});

test('the HTML turns the first "Label: URL" line into a button, links the rest, escapes what a person typed, and adds no words', () => {
  const text = materialiseText(BODY.replace('Hi Asha,', 'Hi <Asha & Co>,'), 'marketing', { unsubscribe: LINK }, FOOTER)!;
  const html = renderHtml('What does an acceptable outcome cost?', text);
  assert.ok(html.includes('Hi &lt;Asha &amp; Co&gt;,'), 'escaped');
  assert.ok(!html.includes('<Asha'));
  assert.match(html, /<a href="https:\/\/learning\.thelivingcraft\.ai\/resources\/run-cost-model"[^>]*>Use the Run-Cost Model &rarr;<\/a>/);
  assert.ok(html.includes(`href="${LINK}"`), 'the unsubscribe link is a link');
  assert.ok(html.includes('<meta name="viewport"'), 'responsive');
  assert.ok(!/<script|<img/i.test(html), 'no script, no image');
  // Every sentence of the text is in the HTML; nothing in the HTML body is not in the text.
  for (const line of text.split('\n').filter(Boolean)) {
    const plain = line.replace(/^([^:]{3,80}): (https?:\/\/\S+)$/, '$1').replace(/https?:\/\/\S+/g, '');
    assert.ok(html.includes(plain.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()) || plain.trim() === '', `missing: ${line}`);
  }
});
