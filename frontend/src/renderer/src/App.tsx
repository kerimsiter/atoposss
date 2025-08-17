import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import ProductManagement from './pages/ProductManagement';
import { modernTheme } from './theme/modernTheme';

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Box sx={{ 
        width: '100%', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
        position: 'relative'
      }}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductManagement />} />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
