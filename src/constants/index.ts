// external
export * from './contributorPlatforms';
export * from './exploreMenuItems';
export * from './otherGamesSubcategories';
export * from './gamePlatforms';
export * from './theme';
export * from './trailsSubcategories';
export * from './ysSubcategories';

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
