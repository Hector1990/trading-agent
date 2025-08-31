import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

export type InputProps = TextFieldProps;

export const Input = forwardRef<HTMLDivElement, InputProps>((props, ref) => {
  return <TextField ref={ref} variant="outlined" fullWidth {...props} />;
});

Input.displayName = 'Input';
