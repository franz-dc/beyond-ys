import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import type { GetStaticProps } from 'next';
import { BsSlashCircleFill } from 'react-icons/bs';
import { FaTimes } from 'react-icons/fa';
import { MdArrowDropDown, MdLayers, MdMusicNote } from 'react-icons/md';
import { PiTriangleFill } from 'react-icons/pi';

import { GenericHeader, Link, MainLayout } from '~/components';
import { TComposerTimeline } from '~/types';

// input is in format of 2019-01
// output is in format of 2019 Jan
const formatReleaseDate = (date: string) => {
  const [year, month] = date.split('-');
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
    'default',
    { month: 'short' }
  );

  return `${year} ${monthName}`;
};

const ComposerTimeline = ({
  games,
  staffMembers,
  composerTimeline,
}: TComposerTimeline) => {
  // arbitrary max width to not make it too wide
  // add 30px every time a new staff member is added
  const maxFullWidth = 1680;

  const columns = [
    'Release Date',
    'Game',
    ...Object.values(staffMembers).map((staffMember) => staffMember.name),
  ];

  const [shownColumnIndexes, setShownColumnIndexes] = useState(
    columns.map((_, idx) => idx)
  );

  // show/hide columns menu
  const [columnsAnchorEl, setColumnsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const columnsMenuOpen = Boolean(columnsAnchorEl);
  const openColumnsMenu = (e: MouseEvent<HTMLButtonElement>) =>
    setColumnsAnchorEl(e.currentTarget);
  const closeColumnsMenu = () => setColumnsAnchorEl(null);

  // options menu
  const [optionsAnchorEl, setOptionsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const optionsMenuOpen = Boolean(optionsAnchorEl);
  const openOptionsMenu = (e: MouseEvent<HTMLButtonElement>) =>
    setOptionsAnchorEl(e.currentTarget);
  const closeOptionsMenu = () => setOptionsAnchorEl(null);

  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isFullPageHeight, setIsFullPageHeight] = useState(false);

  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [theadHeight, setTheadHeight] = useState(150);
  useEffect(() => {
    // height is wrong on first render, so wait a bit
    const timeout = setTimeout(() => {
      if (theadRef.current) {
        setTheadHeight(theadRef.current.clientHeight);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [theadRef]);

  const involvementIcons = {
    composer: (
      <Box
        component={MdMusicNote} // note - created melodies and all
        sx={{
          mt: 0.5,
          color: 'success.main',
          fontSize: 22,
        }}
        title='Composer'
      />
    ),
    arranger: (
      <Box
        component={PiTriangleFill} // delta - change/variation from original
        sx={{
          mt: 0.5,
          color: 'primary.main',
          fontSize: 16,
        }}
        title='Arranger'
      />
    ),
    composerArranger: (
      <Box
        component={MdLayers} // 2 layers - both or either
        sx={{
          mt: 0.5,
          color: 'warning.main',
          fontSize: 20,
        }}
        title='Composer and/or arranger'
      />
    ),
    uncredited: (
      <Box
        component={BsSlashCircleFill} // slash - missing
        sx={{
          mt: 0.5,
          color: 'secondary.main',
          fontSize: 16,
        }}
        title='Uncredited'
      />
    ),
    miscredited: (
      <Box
        component={FaTimes} // x - wrong
        sx={{
          mt: 0.5,
          color: 'error.main',
          fontSize: 22,
        }}
        title='Miscredited'
      />
    ),
  };

  return (
    <MainLayout
      title='Composer Timeline'
      description="Involved composers and arrangers in each of Falcom's works"
      ContainerProps={{
        maxWidth: isFullWidth ? false : 'md',
        sx: {
          maxWidth: isFullWidth ? maxFullWidth : undefined,
        },
      }}
    >
      <GenericHeader
        title='Composer Timeline'
        subtitle="Involved composers and arrangers in each of Falcom's works"
        sx={{ mb: 2 }}
      />
      <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
        <Button
          onClick={openColumnsMenu}
          endIcon={
            <MdArrowDropDown
              style={{
                transition: 'transform 0.1s ease-in-out',
                transform: columnsMenuOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          }
        >
          Show/Hide Columns
        </Button>
        <Button
          onClick={openOptionsMenu}
          endIcon={
            <MdArrowDropDown
              style={{
                transition: 'transform 0.1s ease-in-out',
                transform: optionsMenuOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          }
        >
          Options
        </Button>
      </Stack>
      <Menu
        anchorEl={columnsAnchorEl}
        MenuListProps={{
          dense: true,
        }}
        open={columnsMenuOpen}
        onClose={closeColumnsMenu}
        sx={{
          maxHeight: '60vh',
        }}
      >
        {columns.map((column, idx) => (
          <MenuItem
            key={column}
            onClick={() => {
              if (shownColumnIndexes.includes(idx)) {
                setShownColumnIndexes(
                  shownColumnIndexes.filter((i) => i !== idx)
                );
              } else {
                setShownColumnIndexes([...shownColumnIndexes, idx]);
              }
            }}
          >
            <Checkbox
              checked={shownColumnIndexes.includes(idx)}
              size='small'
              disableRipple
              sx={{
                p: 0,
                pr: 1.5,
              }}
            />
            {column}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={optionsAnchorEl}
        MenuListProps={{
          dense: true,
        }}
        open={optionsMenuOpen}
        onClose={closeOptionsMenu}
      >
        <MenuItem
          onClick={() => {
            setIsFullWidth((prev) => !prev);
            closeOptionsMenu();
          }}
          sx={{
            display: {
              xs: 'none',
              md: 'block',
            },
          }}
        >
          <Checkbox
            checked={isFullWidth}
            size='small'
            disableRipple
            sx={{
              p: 0,
              pr: 1.5,
            }}
          />
          Full Width
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsFullPageHeight((prev) => !prev);
            closeOptionsMenu();
          }}
        >
          <Checkbox
            checked={isFullPageHeight}
            size='small'
            disableRipple
            sx={{
              p: 0,
              pr: 1.5,
            }}
          />
          Full Page Height
        </MenuItem>
      </Menu>
      <Box
        id='composer-timeline-table'
        sx={{
          height: '100vh',
          mb: 3,
          overflowX: 'auto',
          // workaround for buggy responsive table
          width: {
            xs: 'calc(100vw - 32px)',
            sm: 'calc(100vw - 48px)',
            md: isFullWidth ? 'calc(100vw - 48px)' : '100%',
          },
          [`@media (min-width: ${maxFullWidth}px)`]: {
            width: isFullWidth ? maxFullWidth - 48 : '100%',
          },
          maxHeight: isFullPageHeight ? 'none' : 'calc(100vh - 64px - 100px)',
          // approx rounded up height using inspector
          // change this if another staff member with longer name is added
          scrollPaddingTop: theadHeight,
          // borderTopLeftRadius: '8px',
          scrollBehavior: 'smooth',
          '& thead': {
            '& tr': {
              '& th': {
                verticalAlign: 'bottom',
                textAlign: 'left',
                fontWeight: 'medium',
                px: 0.65,
                py: 1,
                '&:first-of-type': {
                  borderTopLeftRadius: '8px',
                  '&:not(.staff-member-header)': {
                    pl: 2,
                  },
                },
                '&:last-of-type': {
                  borderTopRightRadius: '8px',
                },
              },
            },
          },
          '& tbody': {
            '& tr': {
              '& th': {
                px: 0.5,
                py: 1,
                textAlign: 'left',
                '&:first-of-type': {
                  pl: 2,
                },
              },
              '& td': {
                // px: 0.5,
                // py: 1,
                textAlign: 'center',
              },
              '&:nth-of-type(even)': {
                // use js logic to prevent emotion warning about *-child selectors
                [`& > ${
                  shownColumnIndexes.includes(0) ||
                  shownColumnIndexes.includes(1)
                    ? 'th'
                    : 'td'
                }:first-of-type`]: {
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                },
                '& th': {
                  zIndex: 1,
                  backgroundColor: 'background.paper',
                },
                '& td': {
                  backgroundColor: 'background.paper',
                  '&:last-of-type': {
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                  },
                },
              },
              '&:nth-of-type(odd)': {
                '& th': {
                  backgroundColor: 'background.default',
                },
              },
            },
          },
        }}
      >
        <Box
          component='table'
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <Box component='thead' ref={theadRef}>
            <Box
              component='tr'
              className='default-bg'
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              {shownColumnIndexes.includes(0) && (
                <Box
                  component='th'
                  className='header-bg'
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 100,
                    verticalAlign: 'bottom',
                  }}
                >
                  Release Date
                </Box>
              )}
              {shownColumnIndexes.includes(1) && (
                <Box
                  component='th'
                  className='header-bg'
                  sx={{
                    position: 'sticky',
                    left: shownColumnIndexes.includes(0) ? 100 : 0,
                    verticalAlign: 'bottom',
                    minWidth: 100,
                    // borderTopLeftRadius: '8px',
                    zIndex: 100,
                  }}
                >
                  Game
                </Box>
              )}
              {Object.entries(staffMembers).map(
                ([key, { name, firstGame }], idx) =>
                  shownColumnIndexes.includes(idx + 2) ? (
                    <Box
                      className='staff-member-header header-bg'
                      component='th'
                      key={key}
                      sx={{
                        width: 30,
                        maxWidth: 30,
                      }}
                    >
                      <ButtonBase
                        focusRipple
                        onClick={async () => {
                          if (!firstGame) return;

                          document
                            .querySelector(`#${key}-first-appearance`)
                            ?.scrollIntoView();

                          const scrollToTable = () => {
                            const coords = document
                              .querySelector('#composer-timeline-table')
                              ?.getBoundingClientRect();

                            if (!coords) return;

                            const x = window.scrollX + coords.left;
                            const y = window.scrollY + coords.top;

                            window.scrollTo(x, y);
                          };

                          if (navigator.userAgent.includes('Firefox')) {
                            // chrome has delay so this doesn't work
                            // run below if firefox only
                            if (isFullPageHeight) {
                              scrollToTable();
                            } else {
                              window.scrollTo(0, 0);
                            }
                          } else {
                            // for chrome (due to scroll delay)
                            setTimeout(scrollToTable, 1200); // arbitrary delay
                          }
                        }}
                        sx={{
                          color: 'text.primary',
                          textDecoration: 'none',
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          '&:focus .MuiTypography-root': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        <Typography
                          component='span'
                          sx={{
                            fontSize: 14,
                            fontWeight: 'medium',
                            transform: 'rotate(180deg)',
                            transition: 'color 0.1s ease-in-out',
                          }}
                        >
                          {name}
                        </Typography>
                      </ButtonBase>
                    </Box>
                  ) : null
              )}
            </Box>
          </Box>
          <Box component='tbody'>
            {Object.entries(games).map(([gameId, { name, releaseDate }]) => (
              <Box component='tr' key={gameId}>
                {shownColumnIndexes.includes(0) && (
                  <Box
                    component='th'
                    sx={{
                      position: 'sticky',
                      left: 0,
                      minWidth: 100,
                      pl: 2,
                      zIndex: 10,
                    }}
                  >
                    {formatReleaseDate(releaseDate)}
                  </Box>
                )}
                {shownColumnIndexes.includes(1) && (
                  <Box
                    component='th'
                    id={gameId}
                    sx={{
                      position: 'sticky',
                      left: shownColumnIndexes.includes(0) ? 100 : 0,
                      minWidth: {
                        xs: 150,
                        md: 250,
                      },
                    }}
                  >
                    {name}
                  </Box>
                )}
                {Object.entries(staffMembers).map(
                  ([staffId, { firstGame }], idx) =>
                    shownColumnIndexes.includes(idx + 2) ? (
                      <Box
                        component='td'
                        key={staffId}
                        id={
                          firstGame === gameId
                            ? `${staffId}-first-appearance`
                            : undefined
                        }
                        sx={{
                          width: 30,
                          maxWidth: 30,
                        }}
                      >
                        {/* @ts-ignore */}
                        {involvementIcons?.[
                          // @ts-ignore
                          composerTimeline[staffId]?.[gameId]
                        ] || null}
                      </Box>
                    ) : null
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Stack direction='row' spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: -0.5,
              width: 20,
              height: 16,
            }}
          >
            {involvementIcons.composer}
          </Box>
          <Typography component='span'>Composer</Typography>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: -0.1,
              width: 20,
              height: 16,
            }}
          >
            {involvementIcons.arranger}
          </Box>
          <Typography component='span'>Arranger</Typography>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: -0.35,
              width: 20,
              height: 16,
            }}
          >
            {involvementIcons.composerArranger}
          </Box>
          <Typography component='span'>Composer and/or arranger</Typography>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: -0.25,
              width: 20,
              height: 16,
            }}
          >
            {involvementIcons.uncredited}
          </Box>
          <Typography component='span'>
            Uncredited composer, contains holdovers
          </Typography>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: -0.4,
              width: 20,
              height: 16,
            }}
          >
            {involvementIcons.miscredited}
          </Box>
          <Typography component='span'>Miscredited (not involved)</Typography>
        </Stack>
      </Box>
      <Typography sx={{ mb: 2 }}>
        Tip: Click on a staff member to jump to their first appearance.
      </Typography>
      <Typography color='text.secondary'>
        Source:{' '}
        <Link
          href='https://docs.google.com/spreadsheets/d/1zE387MG1GcGzPsvj7XjwP4Jcg9lz0Bz15yrYtGHpc1I/edit#gid=1588700658'
          target='_blank'
          rel='noopener noreferrer'
          sx={{
            color: 'text.secondary',
            '&:hover, &:focus': {
              textDecoration: 'underline',
            },
          }}
        >
          Nihon Falcom (Sound Team J.D.K./jdk) Composer Breakdown Project (as of
          July 2023)
        </Link>
      </Typography>
    </MainLayout>
  );
};

export default ComposerTimeline;

export const getStaticProps: GetStaticProps = () => {
  type TInvolvementType =
    | 'composer'
    | 'arranger'
    | 'uncredited'
    | 'miscredited'
    | 'composerArranger';

  type TComposerTimelineData = Record<
    keyof typeof COMPOSER_TIMELINE_STAFF_MEMBERS,
    Partial<Record<keyof typeof COMPOSER_TIMELINE_GAMES, TInvolvementType>>
  >;

  // type TStaffMember = {
  //   name: string;
  //   staffType: 'jdk' | 'outsourcing';
  //   firstGame: keyof typeof COMPOSER_TIMELINE_GAMES | '';
  // };

  // cspell: disable

  // - keys generated using slugify
  // - releaseDate is in ISO 8601 format (YYYY-MM-DD or YYYY-MM or YYYY)
  const COMPOSER_TIMELINE_GAMES = {
    'dragon-slayer-ii-xanadu': {
      name: 'Dragon Slayer II: Xanadu',
      releaseDate: '1985-10',
    },
    'xanadu-scenario-ii': {
      name: 'Xanadu Scenario II',
      releaseDate: '1986-10',
    },
    'dragon-slayer-jr-romancia': {
      name: 'Dragon Slayer Jr.: Romancia',
      releaseDate: '1986-10',
    },
    'asteka-ii-templo-del-sol': {
      name: 'Asteka II: Templo del Sol',
      releaseDate: '1986-10',
    },
    ys: {
      name: 'Ys',
      releaseDate: '1987-06',
    },
    'dragon-slayer-iv-drasle-family-msx-ver': {
      name: 'Dragon Slayer IV: Drasle Family (MSX)',
      releaseDate: '1987-07',
    },
    'dragon-slayer-iv-drasle-family-famicom-ver': {
      name: 'Dragon Slayer IV: Drasle Family (Famicom)',
      releaseDate: '1987-07',
    },
    'dragon-slayer-ii-xanadu-msx-rom-ver': {
      name: 'Dragon Slayer II: Xanadu (MSX ROM)',
      releaseDate: '1987-10',
    },
    'dragon-slayer-v-sorcerian': {
      name: 'Dragon Slayer V: Sorcerian',
      releaseDate: '1987-12',
    },
    'ys-ii': {
      name: 'Ys II',
      releaseDate: '1988-04',
    },
    'dragon-slayer-v-sorcerian-x1turbo-ver': {
      name: 'Dragon Slayer V: Sorcerian (X1turbo)',
      releaseDate: '1988-05',
    },
    'sorcerian-utility-vol-1': {
      name: 'Sorcerian Utility Vol. 1',
      releaseDate: '1988-07',
    },
    'sorcerian-additional-scenario-vol1': {
      name: 'Sorcerian Additional Scenario Vol.1',
      releaseDate: '1988-07',
    },
    'sorcerian-additional-scenario-vol2-sengoku-sorcerian': {
      name: 'Sorcerian Additional Scenario Vol.2: Sengoku Sorcerian',
      releaseDate: '1988-10',
    },
    'sorcerian-additional-scenario-vol3-pyramid-sorcerian': {
      name: 'Sorcerian Additional Scenario Vol.3: Pyramid Sorcerian',
      releaseDate: '1988-12',
    },
    'star-trader': {
      name: 'Star Trader',
      releaseDate: '1989-03',
    },
    'ys-iii-wanderers-from-ys': {
      name: 'Ys III: Wanderers from Ys',
      releaseDate: '1989-07',
    },
    'dragon-slayer-vi-the-legend-of-heroes': {
      name: 'Dragon Slayer VI: The Legend of Heroes',
      releaseDate: '1989-12',
    },
    'ys-iii-wanderers-from-ys-x68000-ver': {
      name: 'Ys III: Wanderers from Ys (X68000)',
      releaseDate: '1990-03',
    },
    dinosaur: {
      name: 'Dinosaur',
      releaseDate: '1990-12',
    },
    'dragon-slayer-viii-lord-monarch': {
      name: 'Dragon Slayer VIII: Lord Monarch',
      releaseDate: '1991-03',
    },
    brandish: {
      name: 'Brandish',
      releaseDate: '1991-10',
    },
    'advanced-lord-monarch': {
      name: 'Advanced Lord Monarch',
      releaseDate: '1991-11',
    },
    'popful-mail-pc-88-ver': {
      name: 'Popful Mail (PC-88)',
      releaseDate: '1991-12',
    },
    'dragon-slayer-the-legend-of-heroes-ii': {
      name: 'Dragon Slayer: The Legend of Heroes II',
      releaseDate: '1992-03',
    },
    'brandish-2-the-planet-buster': {
      name: 'Brandish 2: The Planet Buster',
      releaseDate: '1993-03',
    },
    'ys-iv-mask-of-the-sun-music-arrangement-by-cube': {
      name: 'Ys IV: Mask of the Sun (CUBE)',
      releaseDate: '1993-11',
    },
    'ys-iv-the-dawn-of-ys-music-arrangement-by-hudson-soft': {
      name: 'Ys IV: The Dawn of Ys (Hudson Soft)',
      releaseDate: '1993-12',
    },
    'dragon-slayer-viii-the-legend-of-xanadu': {
      name: 'Dragon Slayer VIII: The Legend of Xanadu',
      releaseDate: '1994-02',
    },
    'the-legend-of-heroes-iii-white-witch': {
      name: 'The Legend of Heroes III: White Witch',
      releaseDate: '1994-03',
    },
    'popful-mail-sfc-ver': {
      name: 'Popful Mail (SFC)',
      releaseDate: '1994-06',
    },
    'brandish-3-spirit-of-balcan': {
      name: 'Brandish 3: Spirit of Balcan',
      releaseDate: '1994-11',
    },
    'revival-xanadu': {
      name: 'Revival Xanadu',
      releaseDate: '1995-04',
    },
    'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': {
      name: 'The Legend of Xanadu II: The Last of Dragon Slayer',
      releaseDate: '1995-06',
    },
    'revival-xanadu-2-remix': {
      name: 'Revival Xanadu 2 Remix',
      releaseDate: '1995-12',
    },
    'ys-v-lost-kefin-kingdom-of-sand': {
      name: 'Ys V: Lost Kefin, Kingdom of Sand',
      releaseDate: '1995-12',
    },
    'the-legend-of-heroes-iv-a-tear-of-vermillion': {
      name: 'The Legend of Heroes IV: A Tear of Vermillion',
      releaseDate: '1996-05',
    },
    'brandish-vt': {
      name: 'Brandish VT',
      releaseDate: '1996-10',
    },
    'lord-monarch-original': {
      name: 'Lord Monarch Original',
      releaseDate: '1996-12',
    },
    'lord-monarch-first': {
      name: 'Lord Monarch First',
      releaseDate: '1997-03',
    },
    'new-the-legend-of-heroes-windows-ver': {
      name: 'New The Legend of Heroes (Windows)',
      releaseDate: '1997-04',
    },
    'sorcerian-forever': {
      name: 'Sorcerian Forever',
      releaseDate: '1996-06',
    },
    'sega-saturn-falcom-classics': {
      name: 'Sega Saturn Falcom Classics',
      releaseDate: '1997-11',
    },
    'vantage-master': {
      name: 'Vantage Master',
      releaseDate: '1997-12',
    },
    'ys-eternal': {
      name: 'Ys Eternal',
      releaseDate: '1998-04',
    },
    'vantage-master-v2': {
      name: 'Vantage Master V2',
      releaseDate: '1998-07',
    },
    'monarch-monarch': {
      name: 'Monarch Monarch',
      releaseDate: '1998-11',
    },
    'brandish-4-brandish-vt-for-windows': {
      name: 'Brandish 4 (Windows)',
      releaseDate: '1998-12',
    },
    'the-legend-of-heroes-iii-white-witch-windows-ver': {
      name: 'The Legend of Heroes III: White Witch (Windows)',
      releaseDate: '1999-04',
    },
    'the-legend-of-heroes-v-cagesong-of-the-ocean': {
      name: 'The Legend of Heroes V: Cagesong of the Ocean',
      releaseDate: '1999-12',
    },
    'ys-ii-eternal': {
      name: 'Ys II Eternal',
      releaseDate: '2000-07',
    },
    'sorcerian-original': {
      name: 'Sorcerian Original',
      releaseDate: '2000-11',
    },
    'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver': {
      name: 'The Legend of Heroes IV: A Tear of Vermillion (Windows)',
      releaseDate: '2000-12',
    },
    'ys-i-and-ii-complete': {
      name: 'Ys I&II Complete',
      releaseDate: '2001-06',
    },
    zwei: {
      name: 'Zwei!!',
      releaseDate: '2001-12',
    },
    'vm-japan-mystic-far-east': {
      name: 'VM Japan -Mystic Far East-',
      releaseDate: '2002-06',
    },
    'vm-japan-power-up-kit': {
      name: 'VM Japan Power-Up Kit',
      releaseDate: '2002-09',
    },
    'dinosaur-resurrection': {
      name: 'Dinosaur Resurrection',
      releaseDate: '2002-12',
    },
    'ys-vi-the-ark-of-napishtim': {
      name: 'Ys VI: The Ark of Napishtim',
      releaseDate: '2003-09',
    },
    'the-legend-of-heroes-trails-in-the-sky': {
      name: 'The Legend of Heroes: Trails in the Sky',
      releaseDate: '2004-06',
    },
    gurumin: {
      name: 'Gurumin',
      releaseDate: '2004-12',
    },
    'ys-the-oath-in-felghana': {
      name: 'Ys: The Oath in Felghana',
      releaseDate: '2005-06',
    },
    rinne: {
      name: 'RINNE',
      releaseDate: '2005-06',
    },
    'xanadu-next': {
      name: 'Xanadu Next',
      releaseDate: '2005-11',
    },
    'the-legend-of-heroes-trails-in-the-sky-sc': {
      name: 'The Legend of Heroes: Trails in the Sky SC',
      releaseDate: '2006-03',
    },
    'ys-origin': {
      name: 'Ys Origin',
      releaseDate: '2006-12',
    },
    'the-legend-of-heroes-trails-in-the-sky-the-3rd': {
      name: 'The Legend of Heroes: Trails in the Sky the 3rd',
      releaseDate: '2007-06',
    },
    'vantage-master-portable': {
      name: 'Vantage Master Portable',
      releaseDate: '2008-04',
    },
    'zwei-ii': {
      name: 'Zwei II',
      releaseDate: '2008-09',
    },
    'brandish-the-dark-revenant': {
      name: 'Brandish: The Dark Revenant',
      releaseDate: '2009-03',
    },
    'ys-i-and-ii-chronicles': {
      name: 'Ys I&II Chronicles',
      releaseDate: '2009-07',
    },
    'ys-seven': {
      name: 'Ys Seven',
      releaseDate: '2009-09',
    },
    'ys-vs-sora-no-kiseki-alternative-saga': {
      name: 'Ys vs. Sora no Kiseki: Alternative Saga',
      releaseDate: '2010-07',
    },
    'the-legend-of-heroes-zero-no-kiseki': {
      name: 'The Legend of Heroes: Zero no Kiseki',
      releaseDate: '2010-09',
    },
    'the-legend-of-heroes-ao-no-kiseki': {
      name: 'The Legend of Heroes: Ao no Kiseki',
      releaseDate: '2011-09',
    },
    'nayuta-no-kiseki': {
      name: 'Nayuta no Kiseki',
      releaseDate: '2012-07',
    },
    'ys-memories-of-celceta': {
      name: 'Ys: Memories of Celceta',
      releaseDate: '2012-09',
    },
    'the-legend-of-heroes-trails-of-cold-steel': {
      name: 'The Legend of Heroes: Trails of Cold Steel',
      releaseDate: '2013-09',
    },
    'the-legend-of-heroes-trails-of-cold-steel-ii': {
      name: 'The Legend of Heroes: Trails of Cold Steel II',
      releaseDate: '2014-09',
    },
    'tokyo-xanadu-vita-ver': {
      name: 'Tokyo Xanadu (Vita)',
      releaseDate: '2015-09',
    },
    'ys-viii-lacrimosa-of-dana-vita-ver': {
      name: 'Ys VIII -Lacrimosa of DANA- (Vita)',
      releaseDate: '2016-07',
    },
    'tokyo-xanadu-ex-plus-ps4-ver': {
      name: 'Tokyo Xanadu eX+ (PS4)',
      releaseDate: '2016-09',
    },
    'ys-viii-lacrimosa-of-dana-ps4-ver': {
      name: 'Ys VIII -Lacrimosa of DANA- (PS4)',
      releaseDate: '2017-05',
    },
    'the-legend-of-heroes-trails-of-cold-steel-iii': {
      name: 'The Legend of Heroes: Trails of Cold Steel III',
      releaseDate: '2017-09',
    },
    'the-legend-of-heroes-trails-of-cold-steel-iv': {
      name: 'The Legend of Heroes: Trails of Cold Steel IV',
      releaseDate: '2018-09',
    },
    'ys-ix-mostrum-nox': {
      name: 'Ys IX -Mostrum NOX-',
      releaseDate: '2019-09',
    },
    'the-legend-of-heroes-hajimari-no-kiseki': {
      name: 'The Legend of Heroes: Hajimari no Kiseki',
      releaseDate: '2020-08',
    },
    'the-legend-of-heroes-kuro-no-kiseki': {
      name: 'The Legend of Heroes: Kuro no Kiseki',
      releaseDate: '2021-09',
    },
    'the-legend-of-heroes-kuro-no-kiseki-ii': {
      name: 'The Legend of Heroes: Kuro no Kiseki II',
      releaseDate: '2022-09',
    },
    'ys-x-nordics': {
      name: 'Ys X: Nordics',
      releaseDate: '2023-09',
    },
  } as const;

  const COMPOSER_TIMELINE_STAFF_MEMBERS = {
    'toshiya-takahashi': {
      name: 'Toshiya Takahashi',
      staffType: 'jdk',
      firstGame: 'dragon-slayer-ii-xanadu',
    },
    'takahito-abe': {
      name: 'Takahito Abe',
      staffType: 'jdk',
      firstGame: 'xanadu-scenario-ii',
    },
    'yuzo-koshiro': {
      name: 'Yuzo Koshiro',
      staffType: 'jdk',
      firstGame: 'xanadu-scenario-ii',
    },
    'meiko-ishikawa': {
      name: 'Meiko Ishikawa',
      staffType: 'jdk',
      firstGame: 'ys',
    },
    'masaya-hashimoto': {
      name: 'Masaya Hashimoto',
      staffType: 'jdk',
      firstGame: 'ys',
    },
    'hideya-nagata': {
      name: 'Hideya Nagata',
      staffType: 'jdk',
      firstGame: 'dragon-slayer-v-sorcerian',
    },
    'reiko-takebayashi': {
      name: 'Reiko Takebayashi',
      staffType: 'jdk',
      firstGame: 'dragon-slayer-v-sorcerian',
    },
    'masaaki-kawai': {
      name: 'Masaaki Kawai',
      staffType: 'jdk',
      firstGame: 'ys-iii-wanderers-from-ys-x68000-ver',
    },
    'atsushi-shirakawa': {
      name: 'Atsushi Shirakawa',
      staffType: 'jdk',
      firstGame: 'dragon-slayer-viii-lord-monarch',
    },
    'naoki-kaneda': {
      name: 'Naoki Kaneda',
      staffType: 'jdk',
      firstGame: 'brandish-2-the-planet-buster',
    },
    'masaru-nakajima': {
      name: 'Masaru Nakajima',
      staffType: 'jdk',
      firstGame: 'brandish-2-the-planet-buster',
    },
    'takahiro-tsunashima': {
      name: 'Takahiro Tsunashima',
      staffType: 'jdk',
      firstGame: 'brandish-2-the-planet-buster',
    },
    'hirofumi-matsuoda': {
      name: 'Hirofumi Matsuoda',
      staffType: 'jdk',
      firstGame: 'brandish-2-the-planet-buster',
    },
    'satoshi-arai': {
      name: 'Satoshi Arai',
      staffType: 'jdk',
      firstGame: 'brandish-3-spirit-of-balcan',
    },
    'hayato-sonoda': {
      name: 'Hayato Sonoda',
      staffType: 'jdk',
      firstGame: 'sega-saturn-falcom-classics',
    },
    'kaname-ohara': {
      name: 'Kaname Ohara',
      staffType: 'jdk',
      firstGame: 'vantage-master',
    },
    'hirokazu-matsumura': {
      name: 'Hirokazu Matsumura',
      staffType: 'jdk',
      firstGame: 'monarch-monarch',
    },
    'wataru-ishibashi': {
      name: 'Wataru Ishibashi',
      staffType: 'jdk',
      firstGame: 'the-legend-of-heroes-iii-white-witch-windows-ver',
    },
    'maiko-hattori': {
      name: 'Maiko Hattori',
      staffType: 'jdk',
      firstGame: 'the-legend-of-heroes-iii-white-witch-windows-ver',
    },
    'takahide-murayama': {
      name: 'Takahide Murayama',
      staffType: 'jdk',
      firstGame: 'the-legend-of-heroes-trails-in-the-sky',
    },
    'takahiro-unisuga': {
      name: 'Takahiro Unisuga',
      staffType: 'jdk',
      firstGame: 'xanadu-next',
    },
    'ryo-takeshita': {
      name: 'Ryo Takeshita',
      staffType: 'jdk',
      firstGame: 'the-legend-of-heroes-trails-in-the-sky-sc',
    },
    'saki-momiyama': {
      name: 'Saki Momiyama',
      staffType: 'jdk',
      firstGame: 'zwei-ii',
    },
    'masanori-osaki': {
      name: 'Masanori Osaki',
      staffType: 'jdk',
      firstGame: 'zwei-ii',
    },
    'tomokatsu-hagiuda': {
      name: 'Tomokatsu Hagiuda',
      staffType: 'jdk',
      firstGame: 'ys-memories-of-celceta',
    },
    'atsume-hashimoto': {
      name: 'Atsume Hashimoto',
      staffType: 'jdk',
      firstGame: '',
    },
    'shuntaro-koguchi': {
      name: 'Shuntaro Koguchi',
      staffType: 'jdk',
      firstGame: 'the-legend-of-heroes-hajimari-no-kiseki',
    },
    'yukihiro-jindo': {
      name: 'Yukihiro Jindo',
      staffType: 'oursourcing',
      firstGame: 'ys-vi-the-ark-of-napishtim',
    },
    'masahi-okagaki': {
      name: 'Masahi Okagaki',
      staffType: 'oursourcing',
      firstGame: 'ys-the-oath-in-felghana',
    },
    'kohei-wada': {
      name: 'Kohei Wada',
      staffType: 'oursourcing',
      firstGame: 'the-legend-of-heroes-trails-in-the-sky',
    },
    'kimata-kogo': {
      name: 'Kimata Kogo',
      staffType: 'oursourcing',
      firstGame: 'gurumin',
    },
    'ayako-shibazaki': {
      name: 'Ayako Shibazaki',
      staffType: 'oursourcing',
      firstGame: 'xanadu-next',
    },
    'toshiharu-okajima': {
      name: 'Toshiharu Okajima',
      staffType: 'oursourcing',
      firstGame: 'ys-memories-of-celceta',
    },
    'noriyuki-kamikura': {
      name: 'Noriyuki Kamikura',
      staffType: 'oursourcing',
      firstGame: 'nayuta-no-kiseki',
    },
    'mitsuo-singa': {
      name: 'Mitsuo Singa',
      staffType: 'oursourcing',
      firstGame: 'tokyo-xanadu-vita-ver',
    },
    n: {
      name: '"N"',
      staffType: 'jdk',
      firstGame: 'ys-ix-mostrum-nox',
    },
  } as const;

  const COMPOSER_TIMELINE: TComposerTimelineData = {
    'toshiya-takahashi': {
      'dragon-slayer-ii-xanadu': 'composer',
    },
    'takahito-abe': {
      'xanadu-scenario-ii': 'composer',
      'dragon-slayer-jr-romancia': 'composer',
      'asteka-ii-templo-del-sol': 'composer',
    },
    'yuzo-koshiro': {
      'xanadu-scenario-ii': 'composer',
      'dragon-slayer-jr-romancia': 'composer',
      ys: 'composer',
      'dragon-slayer-iv-drasle-family-msx-ver': 'composer',
      'dragon-slayer-iv-drasle-family-famicom-ver': 'composer',
      'dragon-slayer-ii-xanadu-msx-rom-ver': 'composer',
      'dragon-slayer-v-sorcerian': 'composer',
      'ys-ii': 'composer',
      'dragon-slayer-v-sorcerian-x1turbo-ver': 'composer',
    },
    'meiko-ishikawa': {
      ys: 'composer',
      'dragon-slayer-iv-drasle-family-msx-ver': 'composer',
      'dragon-slayer-iv-drasle-family-famicom-ver': 'composer',
      'dragon-slayer-ii-xanadu-msx-rom-ver': 'composer',
      'dragon-slayer-v-sorcerian': 'composer',
      'ys-ii': 'composer',
      'dragon-slayer-v-sorcerian-x1turbo-ver': 'composer',
      'sorcerian-utility-vol-1': 'composer',
      'sorcerian-additional-scenario-vol1': 'composer',
      'sorcerian-additional-scenario-vol2-sengoku-sorcerian': 'composer',
      'sorcerian-additional-scenario-vol3-pyramid-sorcerian': 'composer',
      'star-trader': 'composer',
      'ys-iii-wanderers-from-ys': 'composer',
      'dragon-slayer-vi-the-legend-of-heroes': 'composer',
      'ys-iii-wanderers-from-ys-x68000-ver': 'composer',
      dinosaur: 'composer',
      'dragon-slayer-viii-lord-monarch': 'composer',
      brandish: 'composer',
      'advanced-lord-monarch': 'composer',
      'popful-mail-pc-88-ver': 'composer',
      'dragon-slayer-the-legend-of-heroes-ii': 'composer',
      'brandish-2-the-planet-buster': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'brandish-3-spirit-of-balcan': 'miscredited',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'miscredited',
      'revival-xanadu-2-remix': 'composer',
      'ys-v-lost-kefin-kingdom-of-sand': 'miscredited',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'lord-monarch-original': 'arranger',
      'lord-monarch-first': 'arranger',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
      'sorcerian-forever': 'composer',
      'sega-saturn-falcom-classics': 'arranger',
    },
    'masaya-hashimoto': {
      ys: 'composer',
    },
    'hideya-nagata': {
      'dragon-slayer-v-sorcerian': 'composer',
      'ys-ii': 'composer',
    },
    'reiko-takebayashi': {
      'dragon-slayer-v-sorcerian': 'composer',
    },
    'masaaki-kawai': {
      'ys-iii-wanderers-from-ys-x68000-ver': 'composer',
      dinosaur: 'composer',
      'dragon-slayer-viii-lord-monarch': 'composer',
      'advanced-lord-monarch': 'composer',
    },
    'atsushi-shirakawa': {
      'dragon-slayer-viii-lord-monarch': 'composer',
      brandish: 'composer',
      'advanced-lord-monarch': 'composer',
      'popful-mail-pc-88-ver': 'composer',
      'dragon-slayer-the-legend-of-heroes-ii': 'composer',
      'brandish-2-the-planet-buster': 'composer',
      'ys-iv-mask-of-the-sun-music-arrangement-by-cube': 'composer',
      'ys-iv-the-dawn-of-ys-music-arrangement-by-hudson-soft': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'brandish-3-spirit-of-balcan': 'miscredited',
      'revival-xanadu': 'miscredited',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'composer',
      'revival-xanadu-2-remix': 'composer',
      'ys-v-lost-kefin-kingdom-of-sand': 'composer',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
      'sorcerian-forever': 'composer',
      'sega-saturn-falcom-classics': 'arranger',
      'vantage-master': 'composer',
      'ys-eternal': 'arranger',
      'vantage-master-v2': 'composer',
      'monarch-monarch': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
      zwei: 'composer',
      'vm-japan-mystic-far-east': 'composer',
      'vm-japan-power-up-kit': 'composer',
    },
    'naoki-kaneda': {
      'brandish-2-the-planet-buster': 'composer',
      'ys-iv-mask-of-the-sun-music-arrangement-by-cube': 'composer',
      'ys-iv-the-dawn-of-ys-music-arrangement-by-hudson-soft': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'brandish-3-spirit-of-balcan': 'composer',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'composer',
      'revival-xanadu-2-remix': 'composer',
      'ys-v-lost-kefin-kingdom-of-sand': 'composer',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'lord-monarch-original': 'arranger',
      'lord-monarch-first': 'arranger',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
    },
    'masaru-nakajima': {
      'brandish-2-the-planet-buster': 'composer',
      'ys-iv-mask-of-the-sun-music-arrangement-by-cube': 'composer',
      'ys-iv-the-dawn-of-ys-music-arrangement-by-hudson-soft': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'brandish-3-spirit-of-balcan': 'composer',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'composer',
      'revival-xanadu-2-remix': 'composer',
      'ys-v-lost-kefin-kingdom-of-sand': 'miscredited',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'lord-monarch-original': 'arranger',
      'lord-monarch-first': 'arranger',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
      'sega-saturn-falcom-classics': 'arranger',
      'vantage-master': 'composer',
      'ys-eternal': 'arranger',
      'vantage-master-v2': 'composer',
      'monarch-monarch': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
    },
    'takahiro-tsunashima': {
      'brandish-2-the-planet-buster': 'composer',
      'ys-iv-mask-of-the-sun-music-arrangement-by-cube': 'composer',
      'ys-iv-the-dawn-of-ys-music-arrangement-by-hudson-soft': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'brandish-3-spirit-of-balcan': 'composer',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'composer',
      'revival-xanadu-2-remix': 'composer',
    },
    'hirofumi-matsuoda': {
      'brandish-2-the-planet-buster': 'composer',
      'dragon-slayer-viii-the-legend-of-xanadu': 'composer',
      'the-legend-of-heroes-iii-white-witch': 'composer',
      'popful-mail-sfc-ver': 'composer',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'miscredited',
      'revival-xanadu-2-remix': 'composer',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'lord-monarch-original': 'arranger',
      'lord-monarch-first': 'arranger',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
      'sorcerian-forever': 'composer',
      'monarch-monarch': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'miscredited',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
    },
    'satoshi-arai': {
      'brandish-3-spirit-of-balcan': 'composer',
      'revival-xanadu': 'composer',
      'the-legend-of-xanadu-ii-the-last-of-dragon-slayer': 'composer',
      'revival-xanadu-2-remix': 'composer',
      'ys-v-lost-kefin-kingdom-of-sand': 'composer',
      'the-legend-of-heroes-iv-a-tear-of-vermillion': 'composer',
      'brandish-vt': 'composer',
      'lord-monarch-original': 'arranger',
      'lord-monarch-first': 'arranger',
      'new-the-legend-of-heroes-windows-ver': 'composerArranger',
      'sorcerian-forever': 'composer',
      'sega-saturn-falcom-classics': 'arranger',
      'vantage-master': 'composer',
      'ys-eternal': 'arranger',
      'vantage-master-v2': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
    },
    'hayato-sonoda': {
      'sega-saturn-falcom-classics': 'arranger',
      'vantage-master': 'composer',
      'ys-eternal': 'arranger',
      'vantage-master-v2': 'composer',
      'monarch-monarch': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
      zwei: 'composer',
      'vm-japan-mystic-far-east': 'composer',
      'vm-japan-power-up-kit': 'composer',
      'dinosaur-resurrection': 'arranger',
      'ys-vi-the-ark-of-napishtim': 'composer',
      'the-legend-of-heroes-trails-in-the-sky': 'composer',
      gurumin: 'composer',
      rinne: 'uncredited',
      'xanadu-next': 'composer',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'composer',
      'ys-origin': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky-the-3rd': 'composer',
      'zwei-ii': 'composer',
      'ys-seven': 'composer',
      'ys-vs-sora-no-kiseki-alternative-saga': 'composer',
      'the-legend-of-heroes-zero-no-kiseki': 'composer',
      'the-legend-of-heroes-ao-no-kiseki': 'composer',
      'nayuta-no-kiseki': 'composer',
      'ys-memories-of-celceta': 'arranger',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'composer',
      'tokyo-xanadu-vita-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-vita-ver': 'composer',
      'tokyo-xanadu-ex-plus-ps4-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-ps4-ver': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iii': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iv': 'composer',
      'ys-ix-mostrum-nox': 'composer',
      'the-legend-of-heroes-hajimari-no-kiseki': 'composer',
      'the-legend-of-heroes-kuro-no-kiseki': 'composer',
    },
    'kaname-ohara': {
      'vantage-master': 'composer',
      'ys-eternal': 'arranger',
      'vantage-master-v2': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
    },
    'hirokazu-matsumura': {
      'monarch-monarch': 'composer',
      'brandish-4-brandish-vt-for-windows': 'composerArranger',
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
      'dinosaur-resurrection': 'arranger',
    },
    'wataru-ishibashi': {
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
      zwei: 'composer',
      'vm-japan-mystic-far-east': 'composer',
      'vm-japan-power-up-kit': 'composer',
      'dinosaur-resurrection': 'miscredited',
      'ys-vi-the-ark-of-napishtim': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky': 'composer',
      gurumin: 'composer',
      'xanadu-next': 'composer',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'uncredited',
    },
    'maiko-hattori': {
      'the-legend-of-heroes-iii-white-witch-windows-ver': 'composerArranger',
      'the-legend-of-heroes-v-cagesong-of-the-ocean': 'composer',
      'ys-ii-eternal': 'arranger',
      'sorcerian-original': 'arranger',
      'the-legend-of-heroes-iv-a-tear-of-vermillion-windows-ver':
        'composerArranger',
      'ys-i-and-ii-complete': 'arranger',
      zwei: 'composer',
      'vm-japan-mystic-far-east': 'composer',
      'vm-japan-power-up-kit': 'composer',
      'dinosaur-resurrection': 'arranger',
      'ys-vi-the-ark-of-napishtim': 'uncredited',
      'the-legend-of-heroes-trails-in-the-sky': 'uncredited',
      rinne: 'uncredited',
    },
    'takahide-murayama': {
      'the-legend-of-heroes-trails-in-the-sky': 'composer',
      gurumin: 'composer',
      'xanadu-next': 'composer',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'uncredited',
    },
    'takahiro-unisuga': {
      'xanadu-next': 'composer',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'composer',
      'ys-origin': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky-the-3rd': 'composer',
      'zwei-ii': 'composer',
      'ys-seven': 'composer',
      'ys-vs-sora-no-kiseki-alternative-saga': 'composer',
      'the-legend-of-heroes-zero-no-kiseki': 'composer',
      'the-legend-of-heroes-ao-no-kiseki': 'composer',
      'nayuta-no-kiseki': 'composer',
      'ys-memories-of-celceta': 'arranger',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'composer',
      'tokyo-xanadu-vita-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-vita-ver': 'composer',
      'tokyo-xanadu-ex-plus-ps4-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-ps4-ver': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iii': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iv': 'composer',
      'ys-ix-mostrum-nox': 'composer',
      'the-legend-of-heroes-hajimari-no-kiseki': 'composer',
    },
    'ryo-takeshita': {
      'the-legend-of-heroes-trails-in-the-sky-sc': 'composer',
      'ys-origin': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky-the-3rd': 'composer',
      'zwei-ii': 'uncredited',
      'ys-seven': 'uncredited',
      'the-legend-of-heroes-ao-no-kiseki': 'uncredited',
      'nayuta-no-kiseki': 'uncredited',
      'tokyo-xanadu-vita-ver': 'uncredited',
      'tokyo-xanadu-ex-plus-ps4-ver': 'uncredited',
    },
    'saki-momiyama': {
      'zwei-ii': 'composer',
      'ys-seven': 'composer',
      'ys-vs-sora-no-kiseki-alternative-saga': 'composer',
      'the-legend-of-heroes-zero-no-kiseki': 'composer',
      'the-legend-of-heroes-ao-no-kiseki': 'composer',
      'nayuta-no-kiseki': 'composer',
      'ys-memories-of-celceta': 'arranger',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'uncredited',
    },
    'masanori-osaki': {
      'zwei-ii': 'composer',
      'ys-seven': 'composer',
      'ys-vs-sora-no-kiseki-alternative-saga': 'composer',
      'the-legend-of-heroes-zero-no-kiseki': 'composer',
      'the-legend-of-heroes-ao-no-kiseki': 'uncredited',
      'nayuta-no-kiseki': 'uncredited',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'uncredited',
    },
    'tomokatsu-hagiuda': {
      'ys-memories-of-celceta': 'arranger',
      'the-legend-of-heroes-trails-of-cold-steel': 'uncredited',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'uncredited',
      'tokyo-xanadu-vita-ver': 'uncredited',
      'tokyo-xanadu-ex-plus-ps4-ver': 'uncredited',
    },
    'atsume-hashimoto': {},
    'shuntaro-koguchi': {
      'the-legend-of-heroes-hajimari-no-kiseki': 'composer',
      'the-legend-of-heroes-kuro-no-kiseki': 'composer',
    },
    'yukihiro-jindo': {
      'ys-vi-the-ark-of-napishtim': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky': 'composerArranger',
      gurumin: 'arranger',
      'ys-the-oath-in-felghana': 'arranger',
      'xanadu-next': 'arranger',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'composerArranger',
      'ys-origin': 'composerArranger',
      'the-legend-of-heroes-trails-in-the-sky-the-3rd': 'arranger',
      'vantage-master-portable': 'arranger',
      'zwei-ii': 'composerArranger',
      'brandish-the-dark-revenant': 'arranger',
      'ys-i-and-ii-chronicles': 'arranger',
      'ys-seven': 'arranger',
      'ys-vs-sora-no-kiseki-alternative-saga': 'arranger',
      'the-legend-of-heroes-zero-no-kiseki': 'arranger',
      'the-legend-of-heroes-ao-no-kiseki': 'composerArranger',
      'nayuta-no-kiseki': 'arranger',
      'ys-memories-of-celceta': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'composer',
      'tokyo-xanadu-vita-ver': 'arranger',
      'ys-viii-lacrimosa-of-dana-vita-ver': 'composer',
      'tokyo-xanadu-ex-plus-ps4-ver': 'uncredited',
      'ys-viii-lacrimosa-of-dana-ps4-ver': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iii': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iv': 'composer',
      'ys-ix-mostrum-nox': 'composer',
      'the-legend-of-heroes-hajimari-no-kiseki': 'composer',
      'the-legend-of-heroes-kuro-no-kiseki': 'composer',
    },
    'masahi-okagaki': {
      'ys-the-oath-in-felghana': 'arranger',
    },
    'kohei-wada': {
      'the-legend-of-heroes-trails-in-the-sky': 'arranger',
      'the-legend-of-heroes-trails-in-the-sky-sc': 'composerArranger',
    },
    'kimata-kogo': {
      gurumin: 'arranger',
    },
    'ayako-shibazaki': {
      'xanadu-next': 'arranger',
    },
    'toshiharu-okajima': {
      'ys-memories-of-celceta': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-ii': 'composer',
    },
    'noriyuki-kamikura': {
      'nayuta-no-kiseki': 'arranger',
      'ys-memories-of-celceta': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel': 'composer',
    },
    'mitsuo-singa': {
      'tokyo-xanadu-vita-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-vita-ver': 'composer',
      'tokyo-xanadu-ex-plus-ps4-ver': 'composer',
      'ys-viii-lacrimosa-of-dana-ps4-ver': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iii': 'composer',
      'the-legend-of-heroes-trails-of-cold-steel-iv': 'composer',
      'ys-ix-mostrum-nox': 'composer',
      'the-legend-of-heroes-hajimari-no-kiseki': 'composer',
      'the-legend-of-heroes-kuro-no-kiseki': 'composer',
    },
    n: {
      'ys-ix-mostrum-nox': 'uncredited',
    },
  };

  return {
    props: {
      games: COMPOSER_TIMELINE_GAMES,
      staffMembers: COMPOSER_TIMELINE_STAFF_MEMBERS,
      composerTimeline: COMPOSER_TIMELINE,
    },
  };
};
