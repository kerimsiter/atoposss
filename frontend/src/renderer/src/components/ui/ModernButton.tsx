import React from 'react';
import { Button, ButtonProps, styled } from '@mui/material';

interface ModernButtonProps extends ButtonProps {
  gradient?: boolean;
  glassmorphism?: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'gradient' && prop !== 'glassmorphism',
})<ModernButtonProps>(({ theme, gradient, glassmorphism }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: '0.875rem',
  fontWeight: 500,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  ...(gradient && {
    background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
    border: '1.5px solid transparent',
    color: '#FFFFFF',
    '&:hover': {
      background: 'linear-gradient(180deg, #5A8AFF 0%, #1B4FE6 100%)',
      boxShadow: '0px 6px 20px -10px rgba(45, 104, 255, 0.4)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      background: 'linear-gradient(180deg, #4A7AFF 0%, #0A3FD6 100%)',
      transform: 'translateY(0px)',
    },
  }),
  
  ...(glassmorphism && {
    background: 'rgba(253, 253, 253, 0.8)',
    backdropFilter: 'blur(16px)',
    border: '1.5px solid rgba(246, 246, 246, 1)',
    color: '#1B1B1B',
    '&:hover': {
      background: 'rgba(247, 249, 255, 0.9)',
      border: '1.5px solid rgba(230, 230, 230, 1)',
      boxShadow: '0px 4px 16px -8px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0px)',
    },
  }),
}));

const ModernButton: React.FC<ModernButtonProps> = (props) => {
  const { children, gradient = false, glassmorphism = false, ...otherProps } = props;
  
  return (
    <StyledButton 
      gradient={gradient} 
      glassmorphism={glassmorphism} 
      {...otherProps}
    >
      {children}
    </StyledButton>
  );
};

export default ModernButton;