import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  LinearProgress,
  Alert,
  IconButton,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

interface ModernImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | undefined) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

const UploadContainer = styled(Box)(() => ({
  position: 'relative',
  borderRadius: 12,
  border: '2px dashed #E0E0E0',
  background: '#F8F9FA',
  padding: 32,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  
  '&:hover': {
    borderColor: '#2D68FF',
    background: '#F1F3FF',
  },
  
  '&.dragover': {
    borderColor: '#2D68FF',
    background: '#F1F3FF',
  },
  
  '&.disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    '&:hover': {
      borderColor: '#E0E0E0',
      background: '#F8F9FA',
    },
  },
}));

const PreviewContainer = styled(Box)(() => ({
  position: 'relative',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#FDFDFD',
  border: '1px solid #E0E0E0',
  
  '& img': {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    display: 'block',
  },
}));



const ModernImageUpload: React.FC<ModernImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Desteklenen formatlar: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `Dosya boyutu ${maxSize}MB'dan küçük olmalıdır`;
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:3000/upload/product-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      const imageUrl = `http://localhost:3000${response.data.url}`;
      onChange(imageUrl);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, uploading]);

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
  };



  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {value && !uploading ? (
        <Fade in timeout={300}>
          <PreviewContainer>
            <img src={value} alt="Product preview" />
            <Box sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
            }}>
              <Tooltip title="Resmi Kaldır">
                <IconButton
                  size="small"
                  onClick={handleRemove}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </PreviewContainer>
        </Fade>
      ) : (
        <UploadContainer
          className={`${dragOver ? 'dragover' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >


          {uploading ? (
            <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #EBEBEB 0%, #C4C4C4 100%)',
                border: '1.5px solid rgba(168, 168, 168, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  background: '#E2E2E2',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                }} />
                <Stack spacing={1} alignItems="center" sx={{ p: 1 }}>
                  <Box sx={{ width: 16, height: 2, background: '#1B1B1B', opacity: 0.15, borderRadius: 0.5 }} />
                  <Box sx={{ width: 24, height: 2, background: '#727272', opacity: 0.1, borderRadius: 0.5 }} />
                  <Box sx={{ width: 24, height: 2, background: '#727272', opacity: 0.1, borderRadius: 0.5 }} />
                </Stack>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B1B1B', mb: 0.5 }}>
                  Yükleniyor...
                </Typography>
                <Typography variant="caption" sx={{ color: '#A8A8A8', fontWeight: 500 }}>
                  %{uploadProgress} tamamlandı
                </Typography>
              </Box>
              
              <Box sx={{ width: '100%', maxWidth: 200 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(168, 168, 168, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #779DFF 0%, #2D68FF 100%)',
                      borderRadius: 3,
                    }
                  }}
                />
              </Box>
            </Stack>
          ) : (
            <Stack spacing={3} alignItems="center">
              {/* File Icon */}
              <Box sx={{
                width: 80,
                height: 96,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #EBEBEB 0%, #C4C4C4 100%)',
                border: '1.5px solid rgba(168, 168, 168, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 20,
                  height: 20,
                  background: '#E2E2E2',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                }} />
                
                <Stack spacing={1} alignItems="center" sx={{ p: 2 }}>
                  <Box sx={{ width: 20, height: 3, background: '#1B1B1B', opacity: 0.15, borderRadius: 1 }} />
                  <Box sx={{ width: 32, height: 3, background: '#727272', opacity: 0.1, borderRadius: 1 }} />
                  <Box sx={{ width: 32, height: 3, background: '#727272', opacity: 0.1, borderRadius: 1 }} />
                </Stack>
                
                {/* Upload Icon */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#2D68FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <UploadIcon sx={{ color: 'white', fontSize: 14 }} />
                </Box>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1B1B1B' }}>
                  Ürün Resmi Yükle
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Dosyayı buraya sürükleyin veya tıklayarak seçin
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Typography variant="caption" sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    background: 'rgba(45, 104, 255, 0.1)',
                    color: '#2D68FF',
                    fontWeight: 500
                  }}>
                    Max {maxSize}MB
                  </Typography>
                  <Typography variant="caption" sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    background: 'rgba(0, 166, 86, 0.1)',
                    color: '#00A656',
                    fontWeight: 500
                  }}>
                    JPG, PNG, WebP
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </UploadContainer>
      )}

      {error && (
        <Fade in timeout={300}>
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              background: 'rgba(255, 82, 82, 0.1)',
              border: '1px solid rgba(255, 82, 82, 0.2)',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default ModernImageUpload;