import { createTheme } from '@mui/material/styles';

// Bento Pro inspired modern theme
export const modernTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2D68FF', // Bento blue
            light: '#779DFF',
            dark: '#1B4FE6',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#00A656', // Success green
            light: '#4CAF50',
            dark: '#00832D',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F8F9FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1B1B1B',
            secondary: '#727272',
        },
        grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
        error: {
            main: '#FF5252',
            light: '#FF8A80',
            dark: '#D32F2F',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
        },
        info: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
        },
        success: {
            main: '#00A656',
            light: '#4CAF50',
            dark: '#00832D',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '-0.01em',
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            letterSpacing: '-0.01em',
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            textTransform: 'none',
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0px 1px 8px -4px rgba(0, 0, 0, 0.2)', // Subtle shadow
        '0px 2px 12px -6px rgba(0, 0, 0, 0.15)',
        '0px 4px 16px -8px rgba(0, 0, 0, 0.12)',
        '0px 6px 20px -10px rgba(0, 0, 0, 0.1)',
        '0px 8px 24px -12px rgba(0, 0, 0, 0.08)',
        '0px 10px 28px -14px rgba(0, 0, 0, 0.06)',
        '0px 12px 32px -16px rgba(0, 0, 0, 0.04)',
        '0px 14px 36px -18px rgba(0, 0, 0, 0.02)',
        // Bento Pro style shadows
        '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
        '0px 6px 2px -4px rgba(8, 8, 8, 0.06), 0px 8px 6px -4px rgba(8, 8, 8, 0.06)',
        '0px 8px 3px -4px rgba(8, 8, 8, 0.07), 0px 12px 8px -4px rgba(8, 8, 8, 0.07)',
        '0px 10px 4px -4px rgba(8, 8, 8, 0.08), 0px 16px 12px -4px rgba(8, 8, 8, 0.08)',
        '0px 12px 5px -4px rgba(8, 8, 8, 0.09), 0px 20px 16px -4px rgba(8, 8, 8, 0.09)',
        '0px 14px 6px -4px rgba(8, 8, 8, 0.1), 0px 24px 20px -4px rgba(8, 8, 8, 0.1)',
        '0px 16px 7px -4px rgba(8, 8, 8, 0.11), 0px 28px 24px -4px rgba(8, 8, 8, 0.11)',
        '0px 18px 8px -4px rgba(8, 8, 8, 0.12), 0px 32px 28px -4px rgba(8, 8, 8, 0.12)',
        '0px 20px 9px -4px rgba(8, 8, 8, 0.13), 0px 36px 32px -4px rgba(8, 8, 8, 0.13)',
        '0px 22px 10px -4px rgba(8, 8, 8, 0.14), 0px 40px 36px -4px rgba(8, 8, 8, 0.14)',
        '0px 24px 11px -4px rgba(8, 8, 8, 0.15), 0px 44px 40px -4px rgba(8, 8, 8, 0.15)',
        '0px 26px 12px -4px rgba(8, 8, 8, 0.16), 0px 48px 44px -4px rgba(8, 8, 8, 0.16)',
        '0px 28px 13px -4px rgba(8, 8, 8, 0.17), 0px 52px 48px -4px rgba(8, 8, 8, 0.17)',
        '0px 30px 14px -4px rgba(8, 8, 8, 0.18), 0px 56px 52px -4px rgba(8, 8, 8, 0.18)',
        '0px 32px 15px -4px rgba(8, 8, 8, 0.19), 0px 60px 56px -4px rgba(8, 8, 8, 0.19)',
        '0px 34px 16px -4px rgba(8, 8, 8, 0.2), 0px 64px 60px -4px rgba(8, 8, 8, 0.2)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 16px -8px rgba(0, 0, 0, 0.2)',
                    },
                },
                contained: {
                    background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
                    border: '1.5px solid transparent',
                    backgroundClip: 'padding-box',
                    '&:hover': {
                        background: 'linear-gradient(180deg, #5A8AFF 0%, #1B4FE6 100%)',
                        boxShadow: '0px 6px 20px -10px rgba(45, 104, 255, 0.4)',
                    },
                    '&:active': {
                        background: 'linear-gradient(180deg, #4A7AFF 0%, #0A3FD6 100%)',
                    },
                },
                outlined: {
                    background: 'linear-gradient(180deg, rgba(235, 235, 235, 1) 0%, rgba(196, 196, 196, 1) 100%)',
                    border: '1.5px solid rgba(168, 168, 168, 0.1)',
                    color: '#1B1B1B',
                    '&:hover': {
                        background: 'linear-gradient(180deg, rgba(225, 225, 225, 1) 0%, rgba(186, 186, 186, 1) 100%)',
                        border: '1.5px solid rgba(168, 168, 168, 0.2)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                    background: 'rgba(253, 253, 253, 0.8)',
                    backdropFilter: 'blur(32px)',
                    boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                        boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                    background: 'rgba(253, 253, 253, 0.8)',
                    backdropFilter: 'blur(32px)',
                    boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
                },
                elevation1: {
                    boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
                },
                elevation2: {
                    boxShadow: '0px 2px 12px -6px rgba(0, 0, 0, 0.15)',
                },
                elevation3: {
                    boxShadow: '0px 4px 16px -8px rgba(0, 0, 0, 0.12)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        background: 'rgba(253, 253, 253, 0.8)',
                        backdropFilter: 'blur(16px)',
                        '& fieldset': {
                            border: '1.5px solid rgba(230, 230, 230, 1)',
                        },
                        '&:hover fieldset': {
                            border: '1.5px solid rgba(200, 200, 200, 1)',
                        },
                        '&.Mui-focused fieldset': {
                            border: '1.5px solid #2D68FF',
                        },
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    background: 'rgba(253, 253, 253, 0.8)',
                    backdropFilter: 'blur(16px)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                },
                filled: {
                    background: 'linear-gradient(180deg, rgba(241, 241, 241, 1) 0%, rgba(230, 230, 230, 1) 100%)',
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                    color: '#1B1B1B',
                },
                colorPrimary: {
                    background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
                    color: '#FFFFFF',
                },
                colorSuccess: {
                    background: 'linear-gradient(180deg, #4CAF50 0%, #00A656 100%)',
                    color: '#FFFFFF',
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                    background: 'rgba(253, 253, 253, 0.8)',
                    backdropFilter: 'blur(32px)',
                    boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
                    '& .MuiTableCell-head': {
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#1B1B1B',
                        borderBottom: '1.5px solid rgba(230, 230, 230, 0.5)',
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        background: 'rgba(247, 249, 255, 0.5)',
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: 8,
                    '&:hover': {
                        background: 'rgba(45, 104, 255, 0.08)',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                    background: 'rgba(253, 253, 253, 0.95)',
                    backdropFilter: 'blur(32px)',
                    boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.15)',
                },
            },
        },
    },
});