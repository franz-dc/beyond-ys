import {
  Avatar,
  Box,
  ButtonBase,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { CLOUD_STORAGE_URL } from '~/constants';
import { StaffInfoCacheSchema } from '~/schemas';

import Link from '../Link';

export type StaffMemberItemProps = StaffInfoCacheSchema & {
  id: string;
  disableEllipsis?: boolean;
};

const StaffMemberItem = ({
  id,
  name,
  roles,
  hasAvatar,
  disableEllipsis,
}: StaffMemberItemProps) => (
  <ButtonBase
    focusRipple
    component={Link}
    prefetch={false}
    href={`/staff/${id}`}
    sx={{
      display: 'block',
      borderRadius: 2,
      '&:hover > .MuiPaper-root, &:focus > .MuiPaper-root': {
        boxShadow: ({ shadows }) => shadows[6],
      },
    }}
  >
    <Paper
      sx={{
        px: 2,
        py: 1.5,
      }}
    >
      <Stack direction='row' spacing={2}>
        <Avatar
          src={
            hasAvatar ? `${CLOUD_STORAGE_URL}/staff-avatars/${id}` : undefined
          }
          alt={hasAvatar ? `${name} avatar` : undefined}
          imgProps={{
            loading: 'lazy',
          }}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'text.disabled',
          }}
        />
        <Box>
          <Typography
            sx={{
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: 'text.secondary',
              ...(!disableEllipsis && {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }),
            }}
            aria-label='artist'
          >
            {roles.join(', ') || 'Unknown role'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  </ButtonBase>
);

export default StaffMemberItem;
