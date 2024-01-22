import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MusicItem from './MusicItem';

describe('MusicItem', () => {
  it('should render with artists', () => {
    render(
      <MusicItem
        id='id'
        title='Title'
        artists={[
          { name: 'Artist', link: 'https://example.com' },
          { name: 'Artist 2', link: 'https://example.com' },
        ]}
        duration={10}
        trackNumber={1}
      />
    );
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Artist, Artist 2',
        { exact: false }
      )
    ).toBeDefined();
  });
  it('should render without artists', () => {
    render(
      <MusicItem
        id='id'
        title='Title'
        artists={[]}
        duration={10}
        trackNumber={1}
      />
    );
    expect(screen.getByText('Unknown Composer')).toBeDefined();
  });
  it('should have a play button if youtubeId exists', () => {
    render(
      <MusicItem
        id='id'
        title='Title'
        artists={[]}
        duration={10}
        trackNumber={1}
        youtubeId='youtubeId'
      />
    );
    expect(screen.getByLabelText('play')).toBeDefined();
  });
  it('should not have a play button if no youtubeId ', () => {
    render(
      <MusicItem
        id='id'
        title='Title'
        artists={[]}
        duration={10}
        trackNumber={1}
      />
    );
    expect(screen.queryByLabelText('play')).toBeNull();
  });
});
