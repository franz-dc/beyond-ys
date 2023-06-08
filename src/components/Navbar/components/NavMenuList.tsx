import { FC } from 'react';

import { List, ListItem, ListSubheader } from '@mui/material';

import { LinkProps, Link as UnstyledLink } from '~/components';

const Link = (props: LinkProps) => {
  return (
    <UnstyledLink
      {...props}
      sx={{
        color: 'text.primary',
        fontSize: '0.875rem',
        width: '100%',
        ...props.sx,
      }}
    />
  );
};

interface NavMenuListProps {
  labelPrefix: string;
  subcategory: {
    id: string;
    name: string;
    items: {
      name: string;
      href: string;
    }[];
    hideSubheader?: boolean;
  };
}

const NavMenuList: FC<NavMenuListProps> = ({ labelPrefix, subcategory }) => {
  return (
    <List
      key={subcategory.name}
      sx={{
        width: '100%',
        mb: -1,
        '& .MuiListItem-root': {
          mb: 1,
        },
        // ml: -1,
        '& li': {
          pl: '1rem',
          textIndent: '-1rem',
        },
      }}
      aria-labelledby={`${labelPrefix}-${subcategory.id}`}
      disablePadding
      subheader={
        !subcategory?.hideSubheader ? (
          <ListSubheader
            component='div'
            id={`${labelPrefix}-${subcategory.id}`}
            disableGutters
            disableSticky
            sx={{
              mb: 2,
              pl: 1,
              lineHeight: 'unset',
              fontSize: '1rem',
            }}
          >
            {subcategory.name}
          </ListSubheader>
        ) : undefined
      }
    >
      {subcategory.items.map((item) => (
        <ListItem
          key={item.name}
          disablePadding
          sx={{
            borderRadius: 1,
            // mx: -1,
            mb: '0 !important',
            transition: (theme) =>
              theme.transitions.create(['color', 'background-color'], {
                duration: theme.transitions.duration.shortest,
              }),
            '&:hover, &:focus-within': {
              backgroundColor: 'background.default',
            },
            '&:focus-within *': {
              color: 'text.primary',
            },
          }}
        >
          <Link
            href={item.href}
            sx={{
              px: 1,
              py: 0.5,
              '&:focus': {
                outline: 'none',
                color: ({ palette }) => palette.primary.main + '!important',
              },
            }}
          >
            {item.name}
          </Link>
        </ListItem>
      ))}
    </List>
  );
};

export default NavMenuList;
