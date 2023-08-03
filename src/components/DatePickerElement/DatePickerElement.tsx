import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePickerElement as MuiDatePickerElement } from 'react-hook-form-mui';
import type { DatePickerElementProps, FieldValues } from 'react-hook-form-mui';

const DatePickerElement = <
  T extends FieldValues,
  TInputDate,
  TDate = TInputDate
>(
  props: DatePickerElementProps<T, TInputDate, TDate>
) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <MuiDatePickerElement {...props} />
  </LocalizationProvider>
);

export default DatePickerElement;
