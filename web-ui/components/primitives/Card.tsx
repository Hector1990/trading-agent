import { Card as MuiCard, CardProps as MuiCardProps, CardContent, CardHeader, CardActions, Box, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

export interface CardProps extends Omit<MuiCardProps, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function Card({ title, subtitle, actions, loading, children, ...props }: CardProps) {
  if (loading) {
    return (
      <MuiCard {...props}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="60%" />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={100} />
          </Box>
        </CardContent>
      </MuiCard>
    );
  }

  return (
    <MuiCard {...props}>
      {(title || subtitle) && (
        <CardHeader 
          title={title}
          subheader={subtitle}
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
      )}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  );
}
