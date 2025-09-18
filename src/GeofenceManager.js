import React, { useState, useEffect } from 'react';
import TouristRegionMap from './TouristRegionMap';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fab,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Psychology as AIIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as PredictionIcon,
  MyLocation as MyLocationIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

// Simple Map Component (placeholder)
const ManualGeofenceMap = ({ riskZones, userLocation }) => {
  return (
    <Box sx={{ 
      height: 400, 
      backgroundColor: '#f5f5f5', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid #ddd',
      borderRadius: 1,
      position: 'relative'
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          🗺️ Interactive Risk Zone Map
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Risk Zones: {riskZones.length}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          User Location: {userLocation.latitude ? 
            `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 
            'Not available'
          }
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          Map integration coming soon...
        </Typography>
      </Box>
    </Box>
  );
};

const GeofenceManagerWithML = () => {
  // State management
  const [riskZones, setRiskZones] = useState([]);
  const [aiPredictedZones, setAiPredictedZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskLevel: 'LOW',
    radius: '',
    latitude: '',
    longitude: '',
    isAiGenerated: false
  });
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, riskZone: null });
  const [mlSettings, setMlSettings] = useState({
    enableAutoPredict: true,
    predictionRadius: 500000, // 500km in meters
    updateInterval: 30, // minutes
    confidenceThreshold: 0.6
  });

  // ML API configuration
  const ML_API_BASE_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8000';
  const userBlockchainId = 'admin_user';

  // Enhanced geolocation function
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };
          setUserLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        options
      );
    });
  };

  // Load user location on component mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setLocationLoading(true);
        const location = await getUserLocation();
        showAlert(`📍 Location acquired: ${location.accuracy?.toFixed(0)}m accuracy`, 'success');
      } catch (error) {
        console.error('Location initialization failed:', error);
        showAlert('🚫 Using default area for predictions.', 'warning');
        setUserLocation({
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: null,
          timestamp: new Date()
        });
      } finally {
        setLocationLoading(false);
      }
    };

    initializeLocation();
  }, []);

  // Load risk zones from Firestore
  useEffect(() => {
    const loadRiskZones = () => {
      const riskAreasQuery = query(
        collection(db, 'risk_areas'),
        where('active', '==', true)
      );

      const unsubscribe = onSnapshot(riskAreasQuery, (snapshot) => {
        const riskAreas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Separate AI-generated and manual zones
        const manualZones = riskAreas.filter(zone => !zone.ai_generated);
        const aiZones = riskAreas.filter(zone => zone.ai_generated);
        
        setRiskZones(manualZones);
        setAiPredictedZones(aiZones);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    const unsubscribe = loadRiskZones();
    return () => unsubscribe && unsubscribe();
  }, []);

  // Auto-prediction interval
  useEffect(() => {
    if (mlSettings.enableAutoPredict && userLocation.latitude && userLocation.longitude) {
      const interval = setInterval(() => {
        generateAIPredictions();
      }, mlSettings.updateInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [mlSettings.enableAutoPredict, mlSettings.updateInterval, userLocation]);

  // ML API Functions
  const callMLAPI = async (endpoint, data) => {
    try {
      const response = await axios.post(`${ML_API_BASE_URL}${endpoint}`, data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.error(`ML API Error (${endpoint}):`, error);
      throw error;
    }
  };

  const generateAIPredictions = async () => {
    if (predictionLoading) return;
    
    if (!userLocation.latitude || !userLocation.longitude) {
      showAlert('📍 Please enable location access for accurate predictions', 'warning');
      return;
    }

    setPredictionLoading(true);
    showAlert('🤖 AI analyzing real-time data within 500km...', 'info');

    try {
      const centerLat = userLocation.latitude;
      const centerLon = userLocation.longitude;
      const radiusKm = mlSettings.predictionRadius / 1000;

      const kmToDegrees = 500 / 111.0;
      const bounds = {
        north: centerLat + kmToDegrees,
        south: centerLat - kmToDegrees,
        east: centerLon + kmToDegrees,
        west: centerLon - kmToDegrees
      };

      const [landslideData, floodData, weatherData] = await Promise.all([
        callMLAPI('/predict/landslide', {
          latitude: centerLat,
          longitude: centerLon,
          radius: mlSettings.predictionRadius,
          time_horizon: 24
        }),
        callMLAPI('/predict/flood', {
          area_bounds: bounds,
          prediction_hours: 48
        }),
        callMLAPI('/predict/weather_risk', {
          latitude: centerLat,
          longitude: centerLon,
          forecast_days: 5,
          radius: radiusKm
        })
      ]);

      let totalPredictions = 0;
      const processedZones = new Set();

      // Process all prediction types
      const predictionTypes = [
        { data: landslideData, type: 'landslide', icon: '🏔️' },
        { data: floodData, type: 'flood', icon: '🌊' },
        { data: weatherData, type: 'weather', icon: '🌩️' }
      ];

      for (const { data, type, icon } of predictionTypes) {
        if (data?.success && data.predicted_zones?.length > 0) {
          for (const zone of data.predicted_zones) {
            if (zone.confidence >= mlSettings.confidenceThreshold) {
              const zoneKey = `${type}_${zone.latitude.toFixed(4)}_${zone.longitude.toFixed(4)}`;
              if (!processedZones.has(zoneKey)) {
                await addAIPredictedZone({
                  name: `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)} Risk Zone`,
                  description: `AI-predicted ${type} risk (${(zone.confidence * 100).toFixed(1)}% confidence)`,
                  latitude: zone.latitude,
                  longitude: zone.longitude,
                  risk_level: zone.riskLevel,
                  radius: zone.radius || 500,
                  prediction_type: type,
                  confidence: zone.confidence,
                  estimated_time: zone.estimatedTime
                });
                processedZones.add(zoneKey);
                totalPredictions++;
              }
            }
          }
        }
      }

      if (totalPredictions > 0) {
        showAlert(`🎯 Generated ${totalPredictions} risk predictions!`, 'success');
      } else {
        showAlert(`✅ No significant risks detected. Stay safe!`, 'info');
      }

    } catch (error) {
      console.error('🚨 AI Prediction Error:', error);
      if (error.code === 'ECONNREFUSED') {
        showAlert('❌ ML API server offline. Check backend on port 8000.', 'error');
      } else {
        showAlert('❌ Prediction service unavailable. Try again later.', 'error');
      }
    }

    setPredictionLoading(false);
  };

  const addAIPredictedZone = async (zoneData) => {
    try {
      const existingZone = aiPredictedZones.find(zone => {
        const distance = Math.sqrt(
          Math.pow(zone.latitude - zoneData.latitude, 2) + 
          Math.pow(zone.longitude - zoneData.longitude, 2)
        );
        return distance < 0.01 && zone.prediction_type === zoneData.prediction_type;
      });

      if (existingZone) {
        await updateDoc(doc(db, 'risk_areas', existingZone.id), {
          ...zoneData,
          updated_at: serverTimestamp(),
          ai_generated: true,
          active: true
        });
      } else {
        await addDoc(collection(db, 'risk_areas'), {
          ...zoneData,
          created_at: serverTimestamp(),
          created_by: 'AI_SYSTEM',
          ai_generated: true,
          active: true,
          auto_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
          coordinates: [{
            latitude: zoneData.latitude,
            longitude: zoneData.longitude
          }]
        });
      }
    } catch (error) {
      console.error('❌ Error adding AI predicted zone:', error);
      throw error;
    }
  };

  // Get user's current location for manual form
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert('Geolocation is not supported by this browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        showAlert('Location updated successfully', 'success');
      },
      (error) => {
        showAlert('Error getting location: ' + error.message, 'error');
      }
    );
  };

  // Add new risk zone (manual)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const riskZoneData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseFloat(formData.radius),
        risk_level: formData.riskLevel,
        active: true,
        created_at: serverTimestamp(),
        created_by: userBlockchainId,
        ai_generated: false,
        coordinates: [{
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        }]
      };

      if (editingZone) {
        // Update existing zone
        await updateDoc(doc(db, 'risk_areas', editingZone.id), {
          ...riskZoneData,
          updated_at: serverTimestamp()
        });
        showAlert('Risk zone updated successfully', 'success');
        setEditingZone(null);
      } else {
        // Add new zone
        await addDoc(collection(db, 'risk_areas'), riskZoneData);
        showAlert('Risk zone added successfully', 'success');
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving risk zone:', error);
      showAlert('Error saving risk zone: ' + error.message, 'error');
    }
  };

  // Edit risk zone
  const handleEdit = (zone) => {
    setFormData({
      name: zone.name || '',
      description: zone.description || '',
      riskLevel: zone.risk_level || 'LOW',
      radius: zone.radius?.toString() || '',
      latitude: zone.latitude?.toString() || '',
      longitude: zone.longitude?.toString() || '',
      isAiGenerated: false
    });
    setEditingZone(zone);
    setShowForm(true);
  };

  // Delete risk zone (soft delete)
  const handleDelete = async (riskZone) => {
    try {
      await updateDoc(doc(db, 'risk_areas', riskZone.id), {
        active: false,
        deleted_at: serverTimestamp()
      });
      
      setDeleteDialog({ open: false, riskZone: null });
      showAlert('Risk zone deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting risk zone:', error);
      showAlert('Error deleting risk zone: ' + error.message, 'error');
    }
  };

  // Clear all AI predictions
  const clearAIPredictions = async () => {
    try {
      const batch = [];
      aiPredictedZones.forEach(zone => {
        batch.push(updateDoc(doc(db, 'risk_areas', zone.id), { active: false }));
      });
      
      await Promise.all(batch);
      showAlert('All AI predictions cleared', 'success');
    } catch (error) {
      showAlert('Error clearing AI predictions: ' + error.message, 'error');
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      showAlert('Please enter a name', 'error');
      return false;
    }

    if (!formData.latitude || !formData.longitude) {
      showAlert('Please provide latitude and longitude', 'error');
      return false;
    }

    if (!formData.radius || parseFloat(formData.radius) <= 0) {
      showAlert('Please enter a valid radius', 'error');
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      riskLevel: 'LOW',
      radius: '',
      latitude: '',
      longitude: '',
      isAiGenerated: false
    });
    setEditingZone(null);
  };

  // Show alert
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  // Get risk color and label
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'LOW': return 'warning';
      case 'MODERATE': return 'info';
      case 'HIGH': return 'error';
      case 'EMERGENCY': return 'error';
      default: return 'default';
    }
  };

  const getRiskColorHex = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'LOW': return '#ff9800';
      case 'MODERATE': return '#2196f3';
      case 'HIGH': return '#f44336';
      case 'EMERGENCY': return '#b71c1c';
      default: return '#9e9e9e';
    }
  };

  const getPredictionTypeIcon = (type) => {
    switch (type) {
      case 'landslide': return '🏔️';
      case 'flood': return '🌊';
      case 'weather': return '🌩️';
      default: return '⚠️';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading risk zones...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        AI-Enhanced Risk Zone Manager
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Manage risk areas with AI predictions and manual zones for your Flutter app
      </Typography>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Location Status */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: userLocation.latitude ? '#e8f5e8' : '#fff3e0' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <LocationIcon color={userLocation.latitude ? 'success' : 'warning'} />
          </Grid>
          <Grid item xs>
            <Typography variant="body1">
              {userLocation.latitude 
                ? `📍 Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                : '🚫 Location access required for accurate predictions'
              }
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              onClick={() => getUserLocation()}
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting...' : 'Refresh Location'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* AI Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 AI Prediction Controls
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={mlSettings.enableAutoPredict}
                  onChange={(e) => setMlSettings(prev => ({...prev, enableAutoPredict: e.target.checked}))}
                />
              }
              label="Auto-Predict"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={predictionLoading ? <CircularProgress size={20} /> : <PredictionIcon />}
              onClick={generateAIPredictions}
              disabled={predictionLoading || !userLocation.latitude}
              sx={{ backgroundColor: '#4caf50' }}
              fullWidth
            >
              {predictionLoading ? 'Analyzing...' : 'Generate AI Predictions'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              color="warning"
              onClick={clearAIPredictions}
              disabled={aiPredictedZones.length === 0}
              fullWidth
            >
              Clear AI Zones
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="textSecondary" align="center">
              AI: {aiPredictedZones.length} | Manual: {riskZones.length}
            </Typography>
          </Grid>
        </Grid>

        {predictionLoading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Analyzing real-time weather, seismic, and satellite data...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Manual Zone Management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            📍 Manual Risk Zone Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Add New Zone
          </Button>
        </Box>

        {/* Manual Zone Form */}
        <Collapse in={showForm}>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {editingZone ? '✏️ Edit Risk Zone' : '➕ Add New Manual Risk Zone'}
              </Typography>
              <IconButton
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Name */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Zone Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Crime Area"
                  />
                </Grid>
                
                {/* Risk Level */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Risk Level</InputLabel>
                    <Select
                      value={formData.riskLevel}
                      label="Risk Level"
                      onChange={(e) => setFormData(prev => ({ ...prev, riskLevel: e.target.value }))}
                    >
                      <MenuItem value="LOW">🟡 Low Risk</MenuItem>
                      <MenuItem value="MODERATE">🔵 Moderate Risk</MenuItem>
                      <MenuItem value="HIGH">🔴 High Risk</MenuItem>
                      <MenuItem value="EMERGENCY">⚫ Emergency Zone</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the type of risk in this area..."
                  />
                </Grid>
                
                {/* Location */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    required
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    required
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Radius (meters)"
                    required
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                    placeholder="e.g., 200"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={getCurrentLocation}
                    sx={{ height: '56px' }}
                  >
                    Get My Location
                  </Button>
                </Grid>
                
                {/* Actions */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={editingZone ? <SaveIcon /> : <AddIcon />}
                      sx={{ 
                        backgroundColor: getRiskColorHex(formData.riskLevel),
                        '&:hover': {
                          backgroundColor: getRiskColorHex(formData.riskLevel),
                          opacity: 0.8
                        }
                      }}
                    >
                      {editingZone ? 'Update Zone' : 'Add Risk Zone'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Collapse>
      </Paper>

      {/* AI Settings */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>🔧 AI Prediction Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prediction Radius (km)"
                type="number"
                value={mlSettings.predictionRadius / 1000}
                onChange={(e) => setMlSettings(prev => ({
                  ...prev, 
                  predictionRadius: parseInt(e.target.value) * 1000
                }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Update Interval (minutes)"
                type="number"
                value={mlSettings.updateInterval}
                onChange={(e) => setMlSettings(prev => ({
                  ...prev, 
                  updateInterval: parseInt(e.target.value)
                }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Confidence Threshold"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={mlSettings.confidenceThreshold}
                onChange={(e) => setMlSettings(prev => ({
                  ...prev, 
                  confidenceThreshold: parseFloat(e.target.value)
                }))}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* AI Predicted Zones */}
      {aiPredictedZones.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            🎯 AI-Predicted Risk Zones ({aiPredictedZones.length})
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {aiPredictedZones.map((zone) => (
              <Grid item xs={12} md={6} lg={4} key={zone.id}>
                <Card sx={{ border: `2px solid #9c27b0`, backgroundColor: '#fce4ec' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <span style={{ fontSize: '1.2em', marginRight: 8 }}>
                        {getPredictionTypeIcon(zone.prediction_type)}
                      </span>
                      <AIIcon sx={{ color: '#9c27b0', mr: 1 }} />
                      <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                        {zone.name || 'AI Prediction'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`${zone.risk_level} (${((zone.confidence || 0.7) * 100).toFixed(0)}%)`}
                        color={getRiskColor(zone.risk_level)}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: getRiskColorHex(zone.risk_level),
                          color: 'white'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {zone.description || 'AI-generated risk prediction'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>📍 Location:</strong> {zone.latitude?.toFixed(4)}, {zone.longitude?.toFixed(4)}
                    </Typography>

                    <Typography variant="caption" color="textSecondary">
                      Generated: {zone.created_at ? 
                        new Date(zone.created_at.seconds * 1000).toLocaleString() : 
                        'Recently'
                      }
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialog({ open: true, riskZone: zone })}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* Manual Risk Zones */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        📍 Manual Risk Zones ({riskZones.length})
      </Typography>
      
      <Grid container spacing={2}>
        {riskZones.map((zone) => (
          <Grid item xs={12} md={6} lg={4} key={zone.id}>
            <Card sx={{ border: `2px solid ${getRiskColorHex(zone.risk_level)}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon sx={{ color: getRiskColorHex(zone.risk_level), mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {zone.name || 'Unnamed'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={zone.risk_level || 'MODERATE'}
                    color={getRiskColor(zone.risk_level)}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: getRiskColorHex(zone.risk_level),
                      color: 'white'
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {zone.description || 'No description provided'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>📍 Location:</strong> {zone.latitude?.toFixed(6)}, {zone.longitude?.toFixed(6)}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>🎯 Radius:</strong> {zone.radius || 'N/A'}m
                </Typography>
                
                <Typography variant="caption" color="textSecondary">
                  Created: {zone.created_at ? new Date(zone.created_at.seconds * 1000).toLocaleDateString() : 'Unknown'}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(zone)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialog({ open: true, riskZone: zone })}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {riskZones.length === 0 && aiPredictedZones.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <WarningIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Risk Zones Created
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Click "Add New Zone" button to create your first risk zone or generate AI predictions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                Add Your First Zone
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, riskZone: null })}>
        <DialogTitle>Delete Risk Zone</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{deleteDialog.riskZone?.name}"?
          <br />
          <small>This action cannot be undone.</small>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, riskZone: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialog.riskZone)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Component */}
      
<Paper sx={{ p: 2, mt: 3 }}>
  <Typography variant="h6" gutterBottom>
    🗺️ Northeast India Tourist Regions & Risk Zones
  </Typography>
  <TouristRegionMap 
    riskZones={[...riskZones, ...aiPredictedZones]}
    userLocation={userLocation}
    onRegionSelect={(regionKey, regionData) => {
      console.log('Selected region:', regionData);
      // You can add logic here to filter risk zones by region
    }}
  />
</Paper>

    </Container>
  );
};

export default GeofenceManagerWithML;
