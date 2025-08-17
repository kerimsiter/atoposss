import React from 'react';
import { TextField, TextFieldProps, styled } from '@mui/material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    background: 'rgba(253, 253, 253, 0.8)',
    backdropFilter: 'blur(16px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '& fieldset': {
      border: '1.5px solid rgba(230, 230, 230, 1)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    '&:hover': {
      background: 'rgba(247, 249, 255, 0.9)',
      '& fieldset': {
        border: '1.5px solid rgba(200, 200, 200, 1)',
      },
    },
    
    '&.Mui-focused': {
      background: 'rgba(247, 249, 255, 0.95)',
      boxShadow: '0px 0px 0px 3px rgba(45, 104, 255, 0.1)',
      '& fieldset': {
        border: '1.5px solid #2D68FF',
      },
    },
    
    '&.Mui-error': {
      '& fieldset': {
        border: '1.5px solid #FF5252',
      },
      '&.Mui-focused': {
        boxShadow: '0px 0px 0px 3px rgba(255, 82, 82, 0.1)',
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#727272',
    
    '&.Mui-focused': {
      color: '#2D68FF',
    },
    
    '&.Mui-error': {
      color: '#FF5252',
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem',
    marginLeft: 4,
    marginTop: 6,
  },
}));

const ModernTextField: React.FC<TextFieldProps> = (props) => {
  return <StyledTextField {...props} />;
};

export default ModernTextField;