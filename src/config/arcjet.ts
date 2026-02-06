import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';

if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== 'test') {
  throw new Error('ARCJET_KEY env is required!');
}

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
  ],
});

export const adminClient = aj.withRule(
  slidingWindow({
    mode: 'LIVE',
    interval: '1m',
    max: 20,
  }),
);

export const userClient = aj.withRule(
  slidingWindow({
    mode: 'LIVE',
    interval: '1m',
    max: 10,
  }),
);

export const guestClient = aj.withRule(
  slidingWindow({
    mode: 'LIVE',
    interval: '1m',
    max: 5,
  }),
);
