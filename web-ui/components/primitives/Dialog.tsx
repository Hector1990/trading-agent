import {
  Dialog as MuiDialog,
  DialogProps as MuiDialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

export interface DialogProps extends Omit<MuiDialogProps, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Dialog({ 
  title, 
  actions, 
  showCloseButton = true, 
  onClose, 
  children, 
  ...props 
}: DialogProps) {
  return (
    <MuiDialog onClose={onClose} {...props}>
      {title && (
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" fontWeight={600}>
              {title}
            </Typography>
            {showCloseButton && onClose && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{ ml: 2 }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
}
