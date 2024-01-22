import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  vi.mock('next/router', () => require('next-router-mock'));
  vi.mock('next/font/google', () => ({
    Urbanist: () => ({
      style: {
        fontFamily: 'mocked',
      },
    }),
  }));
});
