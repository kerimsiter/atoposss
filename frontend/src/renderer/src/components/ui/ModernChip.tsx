import React from 'react';
import { Chip, ChipProps, styled } from '@mui/material';

interface ModernChipProps extends ChipProps {
  gradient?: boolean;
}

const StyledChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})<ModernChipProps>(({ theme, gradient, color }) => ({
  borderRadius: 8,
  fontSize: '0.75rem',
  fontWeight: 500,
  height: 28,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  ...(gradient && color === 'primary' && {
    background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(180deg, #5A8AFF 0%, #1B4FE6 100%)',
      boxShadow: '0px 2px 8px -4px rgba(45, 104, 255, 0.4)',
    },
  }),
  
  ...(gradient && color === 'success' && {
    background: 'linear-gradient(180deg, #4CAF50 0%, #00A656 100%)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(180deg, #43A047 0%, #00832D 100%)',
      boxShadow: '0px 2px 8px -4px rgba(0, 166, 86, 0.4)',
    },
  }),
  
  ...(gradient && color === 'error' && {
    background: 'linear-gradient(180deg, #FF8A80 0%, #FF5252 100%)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(180deg, #FF7043 0%, #D32F2F 100%)',
      boxShadow: '0px 2px 8px -4px rgba(255, 82, 82, 0.4)',
    },
  }),
  
  ...(gradient && color === 'warning' && {
    background: 'linear-gradient(180deg, #FFB74D 0%, #FF9800 100%)',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      background: 'linear-gradient(180deg, #FFA726 0%, #F57C00 100%)',
      boxShadow: '0px 2px 8px -4px rgba(255, 152, 0, 0.4)',
    },
  }),
  
  ...(!gradient && {
    background: 'linear-gradient(180deg, rgba(241, 241, 241, 1) 0%, rgba(230, 230, 230, 1) 100%)',
    border: '1.5px solid rgba(246, 246, 246, 1)',
    color: '#1B1B1B',
    '&:hover': {
      background: 'linear-gradient(180deg, rgba(235, 235, 235, 1) 0%, rgba(220, 220, 220, 1) 100%)',
      border: '1.5px solid rgba(230, 230, 230, 1)',
    },
  }),
}));

const ModernChip: React.FC<ModernChipProps> = (props) => {
  const { gradient = false, ...otherProps } = props;
  
  return <StyledChip gradient={gradient} {...otherProps} />;
};

export default ModernChip;