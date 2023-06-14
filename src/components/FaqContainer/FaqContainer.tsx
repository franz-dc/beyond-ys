import { FC, PropsWithChildren } from 'react';

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { MdExpandMore } from 'react-icons/md';

export type FaqContainerProps = PropsWithChildren<{ question: string }>;

const FaqContainer: FC<FaqContainerProps> = ({ question, children }) => (
  <Accordion
    defaultExpanded
    disableGutters
    square
    sx={{
      mb: 2,
      borderRadius: 2,
      '&::before': {
        display: 'none',
      },
    }}
  >
    <AccordionSummary
      expandIcon={<MdExpandMore />}
      sx={{
        fontWeight: 'medium',
        fontSize: '1.25rem',
      }}
    >
      {question}
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

export default FaqContainer;
