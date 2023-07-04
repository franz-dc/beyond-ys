import { FaqContainer, GenericHeader, Link, MainLayout } from '~/components';

const Faqs = () => (
  <MainLayout
    title='Frequently Asked Questions'
    description='Answering questions you might have about the project.'
  >
    <GenericHeader title='Frequently Asked Questions' gutterBottom />
    <FaqContainer question='Why make this website?'>
      This fan website was created for two reasons. The first one is to create a
      website dedicated to Falcom&apos;s works showcasing its games, characters,
      staff, plus a bonus of a built-in player for the game&apos;s soundtracks
      while giving credit to the creators of each. The other reason is for me to
      learn new technologies that are in line with my field of work and to
      create a new design language outside of my work as a breath of fresh air.
    </FaqContainer>
    <FaqContainer question='There is some erroneous information at page X.'>
      If such information is found, please email at{' '}
      <Link
        href='mailto:hello@beyondys.com'
        target='_blank'
        rel='noopener noreferrer'
      >
        hello@beyondys.com
      </Link>{' '}
      and it will be corrected as soon as possible once verified.
    </FaqContainer>
    <FaqContainer question='How often is the website updated with new content?'>
      If there is news about a new game that is going to be released or
      groundbreaking information regarding any topic, every effort will be made
      to ensure up-to-date content.
    </FaqContainer>
    <FaqContainer question='How do I contribute?'>
      As of now, there is no way to directly contribute to the contents of this
      website yet. In the future, depending on the outcome of this project, it
      might be implemented. In the meantime, you can email at{' '}
      <Link
        href='mailto:hello@beyondys.com'
        target='_blank'
        rel='noopener noreferrer'
      >
        hello@beyondys.com
      </Link>{' '}
      or by creating an issue at{' '}
      <Link
        href='https://github.com/franz-dc/beyond-ys/issues'
        target='_blank'
        rel='noopener noreferrer'
      >
        GitHub
      </Link>{' '}
      for suggestions, new features, or new content for this site. If you are
      interested in contributing to the codebase, please refer to the{' '}
      <Link
        href='https://github.com/franz-dc/beyond-ys'
        target='_blank'
        rel='noopener noreferrer'
      >
        GitHub repository
      </Link>{' '}
      for more information.
    </FaqContainer>
    <FaqContainer question='Why is there an embedded video while playing music?'>
      All music tracks are from YouTube (Falcom Music Channel) and are embedded
      in this website to provide playback. Videos are shown alongside the music
      player to comply with{' '}
      <Link
        href='https://developers.google.com/youtube/terms/developer-policies#i.-additional-prohibitions'
        target='_blank'
        rel='noopener noreferrer'
      >
        YouTube API Services Terms of Service.
      </Link>
    </FaqContainer>
  </MainLayout>
);

export default Faqs;
