import { 
  FormControl, 
  InputLabel, 
  Select as MuiSelect, 
  SelectProps as MuiSelectProps,
  MenuItem,
  FormHelperText 
} from '@mui/material';
import { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<MuiSelectProps, 'children'> {
  options: SelectOption[];
  helperText?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ label, options, helperText, error, fullWidth = true, ...props }, ref) => {
    return (
      <FormControl ref={ref} fullWidth={fullWidth} error={error}>
        {label && <InputLabel>{label}</InputLabel>}
        <MuiSelect label={label} {...props}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }
);

Select.displayName = 'Select';
