import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/parser/index.js';
import { buildReply } from '../src/parser/reply.js';

// Monday 2 Nov 2026, 11 AM IST
const now = new Date('2026-11-02T05:30:00Z');
const parse = (text) => parseCommand(text, { now });

test('english command with meeting and email', () => {
  const r = parse('Schedule a meeting with Rahul tomorrow at 3 PM and prepare an email for him');
  const [meeting, email] = r.actions;

  assert.equal(meeting.type, 'meeting');
  assert.equal(meeting.person, 'Rahul');
  assert.equal(meeting.date, '2026-11-03');
  assert.equal(meeting.time, '15:00');
  assert.equal(email.type, 'email');
  assert.equal(email.to, 'Rahul');
  assert.match(email.body, /3:00 PM/);
  assert.deepEqual(r.missing, []);
});

test('hinglish in roman script', () => {
  const r = parse('kal 3 baje rahul ke saath meeting set karo aur usko mail bhej do');
  assert.equal(r.actions.length, 2);
  assert.equal(r.actions[0].person, 'Rahul');
  assert.equal(r.actions[0].date, '2026-11-03');
  assert.equal(r.actions[0].time, '15:00');
  assert.equal(r.actions[1].to, 'Rahul');
});

test('hindi in devanagari (how prisma returns it)', () => {
  const r = parse('कल शाम पांच बजे राहुल के साथ मीटिंग रखो और उसको ईमेल भेजो');
  const meeting = r.actions[0];
  assert.equal(meeting.person, 'Rahul');
  assert.equal(meeting.date, '2026-11-03');
  assert.equal(meeting.time, '17:00');
  assert.equal(r.actions[1].type, 'email');
});

test('honorific is skipped', () => {
  const r = parse('priya ma\'am ke saath parso meeting');
  assert.equal(r.actions[0].person, 'Priya');
  assert.equal(r.actions[0].date, '2026-11-04');
});

test('rahul sir ke saath', () => {
  assert.equal(parse('rahul sir ke saath kal meeting').actions[0].person, 'Rahul');
});

test('saade and morning', () => {
  assert.equal(parse('subah saade 10 baje amit se meeting').actions[0].time, '10:30');
  assert.equal(parse('amit se meeting kal 9:15 pm').actions[0].time, '21:15');
});

test('weekday goes to next occurrence', () => {
  assert.equal(parse('friday ko neha ke saath meeting').actions[0].date, '2026-11-06');
  // today is monday, so "monday" means next week
  assert.equal(parse('monday ko neha ke saath meeting').actions[0].date, '2026-11-09');
});

test('date with month name', () => {
  assert.equal(parse('meeting with karan on 15 november at 11 am').actions[0].date, '2026-11-15');
  assert.equal(parse('meeting with karan on 5 jan at 11 am').actions[0].date, '2027-01-05');
});

test('only email with a topic', () => {
  const r = parse('rohit ko project report ke baare mein mail karo');
  assert.equal(r.actions.length, 1);
  assert.equal(r.actions[0].to, 'Rohit');
  assert.equal(r.actions[0].subject, 'Project Report');
});

test('reports missing fields', () => {
  const r = parse('meeting schedule karo');
  assert.deepEqual(r.missing, ['meeting.person', 'meeting.date', 'meeting.time']);
  assert.equal(buildReply(r), 'Who is the meeting with?');
  assert.equal(buildReply(r, 'hi'), 'मीटिंग किसके साथ करनी है?');
});

test('reply sentence in english and hindi', () => {
  const r = parse('kal 3 baje rahul ke saath meeting aur mail');
  assert.equal(
    buildReply(r, 'en'),
    'Okay. I have a meeting with Rahul tomorrow at three in the afternoon and an email draft ready. Please check it and confirm.',
  );
  assert.equal(
    buildReply(r, 'hi'),
    'ठीक है। Rahul के साथ कल दोपहर तीन बजे की मीटिंग और ईमेल का ड्राफ्ट तैयार है। एक बार देखकर पक्का कर दीजिए।',
  );
});

test('nothing understood', () => {
  const r = parse('aaj mausam kaisa hai');
  assert.equal(r.actions.length, 0);
  assert.match(buildReply(r), /didn't get that/);
});

test('devanagari names become roman', () => {
  assert.equal(parse('प्रिया को ईमेल भेजो').actions[0].to, 'Priya');
  assert.equal(parse('कल अमित के साथ मीटिंग').actions[0].person, 'Amit');
  assert.equal(parse('नेहा से कल मीटिंग').actions[0].person, 'Neha');
});

test('weekday before "ko" is not taken as a name', () => {
  const r = parse('Friday ko shaam 5 baje Priya se meeting');
  assert.equal(r.actions[0].person, 'Priya');
  assert.equal(r.actions[0].time, '17:00');
});
