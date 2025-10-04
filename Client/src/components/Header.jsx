import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Header = () => {
  return (
    <AppBar position="static" className="app-header">
      <Toolbar>
        <Box className="app-logo">
          <AssessmentIcon fontSize="large" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Zenalyst Finance Dashboard
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;