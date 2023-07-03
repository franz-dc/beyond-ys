import { MouseEvent, useEffect, useRef, useState } from 'react';

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
import { format } from 'date-fns';
import { BsSlashCircleFill } from 'react-icons/bs';
import { FaTimes } from 'react-icons/fa';
import { MdArrowDropDown, MdLayers, MdMusicNote } from 'react-icons/md';
import { PiTriangleFill } from 'react-icons/pi';

import { GenericHeader, Link, MainLayout } from '~/components';
import {
  COMPOSER_TIMELINE,
  COMPOSER_TIMELINE_GAMES,
  COMPOSER_TIMELINE_STAFF_MEMBERS,
} from '~/constants/composerTimeline';

const ComposerTimeline = () => {
  // arbitrary max width to not make it too wide
  // add 30px every time a new staff member is added
  const maxFullWidth = 1650;

  const columns = [
    'Release Date',
    'Game',
    ...Object.values(COMPOSER_TIMELINE_STAFF_MEMBERS).map(
      (staffMember) => staffMember.name
    ),
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
    }, 1500);
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
          borderTopLeftRadius: '8px',
          scrollBehavior: 'smooth',
          '& thead': {
            '& tr': {
              '& th': {
                verticalAlign: 'bottom',
                textAlign: 'left',
                fontWeight: 'medium',
                px: 0.65,
                py: 1,
                backgroundColor: 'headerBackground',
                '&:first-of-type:not(.staff-member-header)': {
                  pl: 2,
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
              },
              '& td': {
                // px: 0.5,
                // py: 1,
                textAlign: 'center',
              },
              '& > *:first-child:not(td)': {
                pl: 2,
              },
              '&:nth-of-type(even)': {
                '& > *:first-child': {
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                },
                '& > *:last-child': {
                  borderTopRightRadius: '8px',
                  borderBottomRightRadius: '8px',
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
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              {shownColumnIndexes.includes(0) && (
                <Box
                  component='th'
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
              {Object.entries(COMPOSER_TIMELINE_STAFF_MEMBERS).map(
                ([key, { name, firstGame }], idx) =>
                  shownColumnIndexes.includes(idx + 2) ? (
                    <Box
                      className='staff-member-header'
                      component='th'
                      key={key}
                      sx={{
                        width: 30,
                        maxWidth: 30,
                      }}
                    >
                      <ButtonBase
                        focusRipple
                        onClick={() => {
                          if (!firstGame) return;

                          document
                            .querySelector(`#${key}-first-appearance`)
                            ?.scrollIntoView();

                          // FIXME: chrome has delay so this doesn't work
                          // run below if firefox only
                          if (!navigator.userAgent.includes('Firefox')) return;

                          if (isFullPageHeight) {
                            // TODO: scroll to '#composer-timeline-table'
                            const coords = document
                              .querySelector('#composer-timeline-table')
                              ?.getBoundingClientRect();

                            if (!coords) return;

                            const x = window.scrollX + coords.left;
                            const y = window.scrollY + coords.top;

                            window.scrollTo(x, y);
                          } else {
                            window.scrollTo(0, 0);
                          }
                        }}
                        sx={{
                          color: 'text.primary',
                          textDecoration: 'none',
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                        }}
                      >
                        <Typography
                          component='span'
                          sx={{
                            fontSize: 14,
                            fontWeight: 'medium',
                            transform: 'rotate(180deg)',
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
            {Object.entries(COMPOSER_TIMELINE_GAMES).map(
              ([gameId, { name, releaseDate }]) => (
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
                      {format(new Date(releaseDate), 'yyyy MMM')}
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
                  {Object.entries(COMPOSER_TIMELINE_STAFF_MEMBERS).map(
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
                            COMPOSER_TIMELINE[staffId]?.[gameId]
                          ] || null}
                        </Box>
                      ) : null
                  )}
                </Box>
              )
            )}
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
