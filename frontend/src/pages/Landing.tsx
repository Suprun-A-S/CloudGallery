// src/pages/Landing.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';


const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', flexGrow: 1 }}>
            CloudGallery
          </Typography>
          <Button color="inherit" onClick={() => navigate('/signin')}>
            Вхід
          </Button>
          <Button color="inherit" onClick={() => navigate('/signup')}>
            Спробувати
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" gutterBottom>
          Організуйте ваші зображення за допомогою CloudGallery
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
          Почати
        </Button>
      </Container>
    </>
  );
};

export default Landing;
