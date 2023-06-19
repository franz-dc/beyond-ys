import { FormControlLabel, Switch } from '@mui/material';
import type { FormControlLabelProps } from '@mui/material';
import type { FieldValues } from 'react-hook-form/dist/types/fields';
import { Controller } from 'react-hook-form-mui';
import type { Control, Path } from 'react-hook-form-mui';

type IProps = Omit<FormControlLabelProps, 'control' | 'onChange'>;

export type SwitchElementProps<T extends FieldValues> = IProps & {
  name: Path<T>;
  control?: Control<T>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SwitchElement<TFieldValues extends FieldValues>({
  name,
  control,
  onChange,
  ...other
}: SwitchElementProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              checked={!!field.value}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e);
              }}
            />
          }
          {...other}
        />
      )}
    />
  );
}
