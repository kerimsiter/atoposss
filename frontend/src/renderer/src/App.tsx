import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import ProductManagement from './pages/ProductManagement';
import CategoryManagement from './pages/CategoryManagement';
import TaxManagement from './pages/TaxManagement';
import { modernTheme } from './theme/modernTheme';

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Box sx={{ 
        width: '100%', 
        minHeight: '100vh',
        position: 'relative',
        background: `
          linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%),
          radial-gradient(ellipse 1200px 800px at 0% 0%, rgba(119, 157, 255, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse 1000px 1200px at 100% 100%, rgba(255, 138, 128, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse 800px 600px at 50% 0%, rgba(0, 166, 86, 0.15) 0%, transparent 50%)
        `,
        '& > *': {
          position: 'relative',
          zIndex: 1,
        }
      }}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/taxes" element={<TaxManagement />} />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
