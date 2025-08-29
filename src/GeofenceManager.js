import React, { useState, useEffect } from 'react';
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
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const GeofenceManager = () => {
  // State management
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskLevel: 'LOW',
    radius: '',
    latitude: '',
    longitude: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, riskZone: null });

  // Your user ID - replace with actual user authentication
  const userBlockchainId = 'admin_user';

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

        setRiskZones(riskAreas);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    const unsubscribe = loadRiskZones();
    return () => unsubscribe && unsubscribe();
  }, []);

  // Get user's current location
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

  // Add new risk zone
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
        // Keep coordinates format for Flutter compatibility
        coordinates: [{
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        }]
      };

      await addDoc(collection(db, 'risk_areas'), riskZoneData);

      resetForm();
      setShowForm(false);
      showAlert('Risk zone added successfully', 'success');
    } catch (error) {
      console.error('Error adding risk zone:', error);
      showAlert('Error adding risk zone: ' + error.message, 'error');
    }
  };

  // Delete risk zone (soft delete)
  const handleDelete = async (riskZone) => {
    try {
      await updateDoc(doc(db, 'risk_areas', riskZone.id), {
        active: false
      });
      
      setDeleteDialog({ open: false, riskZone: null });
      showAlert('Risk zone deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting risk zone:', error);
      showAlert('Error deleting risk zone: ' + error.message, 'error');
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
      longitude: ''
    });
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Risk Zone Manager
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Manage risk areas with different threat levels for your Flutter app
      </Typography>

      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Add Risk Zone Form */}
      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Risk Zone
          </Typography>

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
                  startIcon={<LocationIcon />}
                  onClick={getCurrentLocation}
                  sx={{ height: '56px' }}
                >
                  Get Location
                </Button>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ 
                      backgroundColor: getRiskColorHex(formData.riskLevel),
                      '&:hover': {
                        backgroundColor: getRiskColorHex(formData.riskLevel),
                        opacity: 0.8
                      }
                    }}
                  >
                    Add Risk Zone
                  </Button>
                  <Button
                    variant="outlined"
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
      )}

      {/* Risk Zones List */}
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
                  <strong>Location:</strong> {zone.latitude?.toFixed(6)}, {zone.longitude?.toFixed(6)}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Radius:</strong> {zone.radius || 'N/A'}m
                </Typography>

                <Typography variant="caption" color="textSecondary">
                  Created: {zone.created_at ? new Date(zone.created_at.seconds * 1000).toLocaleDateString() : 'Unknown'}
                </Typography>
              </CardContent>

              <CardActions>
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

        {riskZones.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <WarningIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Risk Zones Created
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Click the + button to add your first risk zone
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Button */}
      <Fab
        color="error"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowForm(true)}
      >
        <AddIcon />
      </Fab>

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
    </Container>
  );
};

export default GeofenceManager;
