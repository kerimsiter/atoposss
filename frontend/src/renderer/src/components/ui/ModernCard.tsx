import React from 'react';
import { Card, CardProps, styled } from '@mui/material';

interface ModernCardProps extends CardProps {
  glassmorphism?: boolean;
  hover?: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'glassmorphism' && prop !== 'hover',
})<ModernCardProps>(({ theme, glassmorphism, hover }) => ({
  borderRadius: 16,
  border: '1.5px solid rgba(246, 246, 246, 1)',
  background: glassmorphism 
    ? 'rgba(253, 253, 253, 0.7)' 
    : 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  ...(hover && {
    '&:hover': {
      boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-2px)',
      border: '1.5px solid rgba(230, 230, 230, 1)',
    },
  }),
}));

const ModernCard: React.FC<ModernCardProps> = (props) => {
  const { children, glassmorphism = true, hover = true, ...otherProps } = props;
  
  return (
    <StyledCard 
      glassmorphism={glassmorphism} 
      hover={hover} 
      {...otherProps}
    >
      {children}
    </StyledCard>
  );
};

export default ModernCard;