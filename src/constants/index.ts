// external
export * from './contributorPlatforms';
export * from './exploreMenuItems';
export * from './otherGamesSubcategories';
export * from './gamePlatforms';
export * from './theme';
export * from './trailsSubcategories';
export * from './ysSubcategories';

// env
export const CLOUD_STORAGE_URL =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
    ? `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_URL}:${process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT}/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`
    : `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`;

export const SITE_NAME = 'Beyond Ys';
export const CATEGORIES_WITH_TIMELINE = ['Ys Series', 'Trails Series'] as const;

// alphabetized by language
export const COUNTRIES = [
  {
    name: 'China',
    countryCode: 'CN',
    language: 'Chinese',
  },
  {
    name: 'United States',
    countryCode: 'US',
    language: 'English',
  },
  {
    name: 'France',
    countryCode: 'FR',
    language: 'French',
  },
  {
    name: 'Japan',
    countryCode: 'JP',
    language: 'Japanese',
  },
  {
    name: 'South Korea',
    countryCode: 'KR',
    language: 'Korean',
  },
];

export const LANGUAGES = [
  {
    id: '',
    label: 'Unknown',
  },
  ...COUNTRIES.map((c) => ({
    id: c.language,
    label: c.language,
  })),
];
