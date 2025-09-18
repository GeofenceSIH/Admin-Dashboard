import React from 'react';
import { Box, Typography } from '@mui/material';

const ManualGeofenceMap = ({ riskZones, userLocation }) => {
  return (
    <Box sx={{ 
      height: 400, 
      backgroundColor: '#f5f5f5', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid #ddd',
      borderRadius: 1
    }}>
      <Typography variant="body1" color="textSecondary">
        🗺️ Map component will be implemented here
        <br />
        Risk Zones: {riskZones.length}
        <br />
        User Location: {userLocation.latitude ? 
          `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 
          'Not available'
        }
      </Typography>
    </Box>
  );
};

export default ManualGeofenceMap;
