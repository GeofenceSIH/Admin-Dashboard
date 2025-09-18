import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  LocationOn as LocationIcon,
  Tourism as TourismIcon,
  Landscape as LandscapeIcon,
  Temple as TempleIcon,
  Park as ParkIcon,
  Add as AddIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// North East India Tourist Regions Data (keeping existing data)
const northEastRegions = {
  assam: {
    name: "Assam",
    capital: "Dispur",
    center: [26.2006, 92.9376],
    attractions: [
      {
        name: "Kaziranga National Park",
        coordinates: [26.5775, 93.1712],
        type: "wildlife",
        description: "Famous for one-horned rhinoceros",
        riskLevel: "LOW"
      },
      {
        name: "Majuli Island",
        coordinates: [27.0000, 94.2167],
        type: "cultural",
        description: "World's largest river island",
        riskLevel: "LOW"
      },
      {
        name: "Guwahati (Kamakhya Temple)",
        coordinates: [26.1445, 91.7362],
        type: "religious",
        description: "Ancient Shakti Peeth temple",
        riskLevel: "LOW"
      }
    ]
  },
  arunachal: {
    name: "Arunachal Pradesh", 
    capital: "Itanagar",
    center: [28.2180, 94.7278],
    attractions: [
      {
        name: "Tawang Monastery",
        coordinates: [27.5860, 91.8687],
        type: "religious",
        description: "Largest monastery in India",
        riskLevel: "MODERATE"
      },
      {
        name: "Ziro Valley",
        coordinates: [27.5460, 93.8361],
        type: "cultural",
        description: "UNESCO World Heritage Site",
        riskLevel: "LOW"
      },
      {
        name: "Namdapha National Park",
        coordinates: [27.4833, 96.4167],
        type: "wildlife",
        description: "Tiger and snow leopard habitat",
        riskLevel: "HIGH"
      }
    ]
  },
  manipur: {
    name: "Manipur",
    capital: "Imphal", 
    center: [24.6637, 93.9063],
    attractions: [
      {
        name: "Loktak Lake",
        coordinates: [24.5218, 93.7752],
        type: "nature",
        description: "Floating phumdis and Keibul Lamjao",
        riskLevel: "MODERATE"
      },
      {
        name: "Kangla Fort",
        coordinates: [24.8067, 93.9450],
        type: "historical",
        description: "Ancient Manipuri royal palace",
        riskLevel: "LOW"
      },
      {
        name: "Shirui Hills",
        coordinates: [25.1167, 94.4667],
        type: "nature",
        description: "Home to rare Shirui Lily",
        riskLevel: "MODERATE"
      }
    ]
  },
  meghalaya: {
    name: "Meghalaya",
    capital: "Shillong",
    center: [25.4670, 91.3662],
    attractions: [
      {
        name: "Cherrapunji (Sohra)",
        coordinates: [25.3000, 91.7000],
        type: "nature", 
        description: "Wettest place on Earth",
        riskLevel: "HIGH"
      },
      {
        name: "Mawlynnong Village",
        coordinates: [25.2167, 91.8833],
        type: "cultural",
        description: "Asia's cleanest village",
        riskLevel: "LOW"
      },
      {
        name: "Living Root Bridges",
        coordinates: [25.2833, 91.7000],
        type: "nature",
        description: "Natural root bridges of Khasi people",
        riskLevel: "MODERATE"
      }
    ]
  },
  mizoram: {
    name: "Mizoram",
    capital: "Aizawl",
    center: [23.1645, 92.9376],
    attractions: [
      {
        name: "Phawngpui (Blue Mountain)",
        coordinates: [22.6167, 93.0333],
        type: "nature",
        description: "Highest peak in Mizoram",
        riskLevel: "HIGH"
      },
      {
        name: "Reiek Hills",
        coordinates: [23.7667, 92.6500],
        type: "nature",
        description: "Panoramic valley views",
        riskLevel: "MODERATE"
      },
      {
        name: "Champhai",
        coordinates: [23.4500, 93.3167],
        type: "cultural",
        description: "Gateway to Myanmar border",
        riskLevel: "MODERATE"
      }
    ]
  },
  nagaland: {
    name: "Nagaland",
    capital: "Kohima", 
    center: [26.1584, 94.5624],
    attractions: [
      {
        name: "Kohima War Cemetery",
        coordinates: [25.6751, 94.1086],
        type: "historical",
        description: "WWII memorial site",
        riskLevel: "LOW"
      },
      {
        name: "Dzukou Valley",
        coordinates: [25.5500, 94.1000],
        type: "nature",
        description: "Valley of flowers trek",
        riskLevel: "MODERATE"
      },
      {
        name: "Hornbill Festival (Kisama)",
        coordinates: [25.7500, 94.0167],
        type: "cultural", 
        description: "Festival of festivals",
        riskLevel: "LOW"
      }
    ]
  },
  tripura: {
    name: "Tripura",
    capital: "Agartala",
    center: [23.9408, 91.9882],
    attractions: [
      {
        name: "Ujjayanta Palace",
        coordinates: [23.8315, 91.2868],
        type: "historical",
        description: "Former royal palace",
        riskLevel: "LOW"
      },
      {
        name: "Neermahal Palace",
        coordinates: [23.7667, 91.4333],
        type: "historical", 
        description: "Palace in the middle of lake",
        riskLevel: "LOW"
      },
      {
        name: "Sepahijala Wildlife Sanctuary",
        coordinates: [23.7000, 91.3167],
        type: "wildlife",
        description: "Clouded leopard sanctuary",
        riskLevel: "MODERATE"
      }
    ]
  },
  sikkim: {
    name: "Sikkim",
    capital: "Gangtok",
    center: [27.5330, 88.5122], 
    attractions: [
      {
        name: "Tsomgo Lake",
        coordinates: [27.4000, 88.7500],
        type: "nature",
        description: "Sacred glacial lake",
        riskLevel: "HIGH"
      },
      {
        name: "Rumtek Monastery",
        coordinates: [27.2833, 88.5667],
        type: "religious",
        description: "Important Buddhist monastery",
        riskLevel: "LOW"
      },
      {
        name: "Yumthang Valley",
        coordinates: [27.7167, 88.7167],
        type: "nature",
        description: "Valley of flowers",
        riskLevel: "HIGH"
      },
      {
        name: "Nathula Pass",
        coordinates: [27.3833, 88.8500],
        type: "adventure",
        description: "India-China border pass",
        riskLevel: "HIGH"
      }
    ]
  }
};

// Map bounds for Northeast India
const northEastBounds = [
  [21.5, 87.0], // Southwest corner
  [29.5, 97.5]  // Northeast corner
];

// Component to handle map view changes
const MapController = ({ selectedRegion, attractions }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRegion && northEastRegions[selectedRegion]) {
      const region = northEastRegions[selectedRegion];
      map.setView(region.center, 8);
    } else {
      map.fitBounds(northEastBounds);
    }
  }, [selectedRegion, map]);

  return null;
};

// Component to handle map events (right-click)
const MapEvents = ({ onRightClick }) => {
  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onRightClick(e.latlng);
    }
  });
  return null;
};

// Main component
const TouristRegionMap = ({ riskZones = [], userLocation, onRegionSelect }) => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showAttractions, setShowAttractions] = useState(true);
  
  // New states for right-click zone marking
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [newZoneData, setNewZoneData] = useState({
    name: '',
    description: '',
    riskLevel: 'LOW',
    radius: 200,
    zoneType: 'RISK' // RISK or SAFE
  });
  const [alertState, setAlertState] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const userBlockchainId = 'admin_user';

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'LOW': return '#4caf50';
      case 'MODERATE': return '#ff9800';
      case 'HIGH': return '#f44336';
      case 'EMERGENCY': return '#b71c1c';
      case 'SAFE': return '#2e7d32';
      default: return '#2196f3';
    }
  };

  const getAttractionIcon = (type) => {
    switch (type) {
      case 'wildlife': return '🦏';
      case 'religious': return '🛕';
      case 'cultural': return '🏛️';
      case 'nature': return '🏔️';
      case 'historical': return '🏰';
      case 'adventure': return '🧗';
      default: return '📍';
    }
  };

  const handleRegionChange = (event) => {
    const region = event.target.value;
    setSelectedRegion(region);
    if (onRegionSelect) {
      onRegionSelect(region, northEastRegions[region]);
    }
  };

  const getAllAttractions = () => {
    if (selectedRegion && northEastRegions[selectedRegion]) {
      return northEastRegions[selectedRegion].attractions;
    }
    return Object.values(northEastRegions).flatMap(region => region.attractions);
  };

  // Handle right-click on map
  const handleMapRightClick = (latlng) => {
    setSelectedLocation(latlng);
    setNewZoneData({
      name: '',
      description: '',
      riskLevel: 'LOW',
      radius: 200,
      zoneType: 'RISK'
    });
    setContextMenuOpen(true);
  };

  // Handle zone creation
  const handleCreateZone = async () => {
    if (!selectedLocation || !newZoneData.name.trim()) {
      showAlert('Please enter a zone name', 'error');
      return;
    }

    try {
      const zoneData = {
        name: newZoneData.name.trim(),
        description: newZoneData.description.trim() || `${newZoneData.zoneType.toLowerCase()} zone created from map`,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        radius: parseInt(newZoneData.radius),
        risk_level: newZoneData.zoneType === 'SAFE' ? 'SAFE' : newZoneData.riskLevel,
        active: true,
        created_at: serverTimestamp(),
        created_by: userBlockchainId,
        ai_generated: false,
        zone_type: newZoneData.zoneType,
        coordinates: [{
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        }]
      };

      await addDoc(collection(db, 'risk_areas'), zoneData);

      showAlert(
        `✅ ${newZoneData.zoneType === 'SAFE' ? 'Safe' : 'Risk'} zone "${newZoneData.name}" created successfully!`, 
        'success'
      );
      
      // Reset and close dialog
      setContextMenuOpen(false);
      setSelectedLocation(null);
      setNewZoneData({
        name: '',
        description: '',
        riskLevel: 'LOW',
        radius: 200,
        zoneType: 'RISK'
      });

    } catch (error) {
      console.error('Error creating zone:', error);
      showAlert('❌ Failed to create zone: ' + error.message, 'error');
    }
  };

  const showAlert = (message, severity) => {
    setAlertState({
      open: true,
      message,
      severity
    });
  };

  const attractions = getAllAttractions();

  return (
    <Box sx={{ height: '600px', width: '100%' }}>
      {/* Alert Snackbar */}
      <Snackbar
        open={alertState.open}
        autoHideDuration={4000}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={alertState.severity}
          onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
        >
          {alertState.message}
        </Alert>
      </Snackbar>

      {/* Controls (keeping existing functionality) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Region</InputLabel>
                <Select
                  value={selectedRegion}
                  label="Select Region"
                  onChange={handleRegionChange}
                >
                  <MenuItem value="">
                    <em>All Northeast India</em>
                  </MenuItem>
                  {Object.entries(northEastRegions).map(([key, region]) => (
                    <MenuItem key={key} value={key}>
                      {region.name} ({region.capital})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                🎯 Tourist Attractions: {attractions.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ⚠️ Risk Zones: {riskZones.length}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={() => setShowAttractions(!showAttractions)}
                size="small"
              >
                {showAttractions ? 'Hide' : 'Show'} Attractions
              </Button>
            </Grid>
          </Grid>

          {/* Instructions for new feature */}
          <Alert severity="info" sx={{ mt: 2 }}>
            💡 <strong>Right-click</strong> anywhere on the map to mark a location as Risk or Safe zone
          </Alert>

          {selectedRegion && northEastRegions[selectedRegion] && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                🌟 {northEastRegions[selectedRegion].name} Highlights
              </Typography>
              <Grid container spacing={1}>
                {northEastRegions[selectedRegion].attractions.map((attraction, index) => (
                  <Grid item key={index}>
                    <Chip
                      icon={<span>{getAttractionIcon(attraction.type)}</span>}
                      label={attraction.name}
                      variant="outlined"
                      size="small"
                      clickable
                      onClick={() => setSelectedAttraction(attraction)}
                      color={attraction.riskLevel === 'LOW' ? 'success' : 
                             attraction.riskLevel === 'MODERATE' ? 'warning' : 'error'}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Box sx={{ height: 'calc(100% - 140px)', border: '1px solid #ddd', borderRadius: 1 }}>
        <MapContainer
          bounds={northEastBounds}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController selectedRegion={selectedRegion} attractions={attractions} />
          <MapEvents onRightClick={handleMapRightClick} />

          {/* User Location */}
          {userLocation?.latitude && userLocation?.longitude && (
            <Marker position={[userLocation.latitude, userLocation.longitude]}>
              <Popup>
                <div>
                  <strong>📍 Your Location</strong><br />
                  Lat: {userLocation.latitude.toFixed(4)}<br />
                  Lng: {userLocation.longitude.toFixed(4)}<br />
                  Accuracy: {userLocation.accuracy?.toFixed(0)}m
                </div>
              </Popup>
            </Marker>
          )}

          {/* Tourist Attractions (keeping existing functionality) */}
          {showAttractions && attractions.map((attraction, index) => (
            <Marker
              key={`attraction-${index}`}
              position={attraction.coordinates}
              icon={L.divIcon({
                html: `<div style="
                  background: ${getRiskColor(attraction.riskLevel)};
                  width: 25px;
                  height: 25px;
                  border-radius: 50%;
                  border: 2px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${getAttractionIcon(attraction.type)}</div>`,
                className: 'custom-marker',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div>
                  <strong>{getAttractionIcon(attraction.type)} {attraction.name}</strong><br />
                  <em>{attraction.description}</em><br />
                  <Chip 
                    label={attraction.riskLevel}
                    size="small"
                    color={attraction.riskLevel === 'LOW' ? 'success' : 
                           attraction.riskLevel === 'MODERATE' ? 'warning' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Existing Risk Zones (keeping existing functionality) */}
          {riskZones.map((zone, index) => (
            <React.Fragment key={`risk-${zone.id || index}`}>
              <Circle
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius || 500}
                pathOptions={{
                  color: getRiskColor(zone.risk_level),
                  fillColor: getRiskColor(zone.risk_level),
                  fillOpacity: zone.zone_type === 'SAFE' ? 0.1 : 0.2,
                  dashArray: zone.zone_type === 'SAFE' ? '5, 5' : null
                }}
              />
              <Marker position={[zone.latitude, zone.longitude]}>
                <Popup>
                  <div>
                    <strong>
                      {zone.zone_type === 'SAFE' ? '✅' : '⚠️'} {zone.name || 'Zone'}
                    </strong><br />
                    {zone.description && <><em>{zone.description}</em><br /></>}
                    <strong>Type:</strong> {zone.zone_type || 'Risk'} Zone<br />
                    <strong>Level:</strong> {zone.risk_level}<br />
                    <strong>Radius:</strong> {zone.radius || 500}m<br />
                    {zone.ai_generated && <em>🤖 AI Generated</em>}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </Box>

      {/* Right-click Zone Creation Dialog */}
      <Dialog 
        open={contextMenuOpen} 
        onClose={() => setContextMenuOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📍 Create Zone at Selected Location
        </DialogTitle>
        <DialogContent>
          {selectedLocation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Location:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zone Name"
                required
                value={newZoneData.name}
                onChange={(e) => setNewZoneData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Tourist Rest Area"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Zone Type</InputLabel>
                <Select
                  value={newZoneData.zoneType}
                  label="Zone Type"
                  onChange={(e) => setNewZoneData(prev => ({ ...prev, zoneType: e.target.value }))}
                >
                  <MenuItem value="RISK">⚠️ Risk Zone</MenuItem>
                  <MenuItem value="SAFE">✅ Safe Zone</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {newZoneData.zoneType === 'RISK' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    value={newZoneData.riskLevel}
                    label="Risk Level"
                    onChange={(e) => setNewZoneData(prev => ({ ...prev, riskLevel: e.target.value }))}
                  >
                    <MenuItem value="LOW">🟡 Low Risk</MenuItem>
                    <MenuItem value="MODERATE">🔵 Moderate Risk</MenuItem>
                    <MenuItem value="HIGH">🔴 High Risk</MenuItem>
                    <MenuItem value="EMERGENCY">⚫ Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Radius (meters)"
                type="number"
                value={newZoneData.radius}
                onChange={(e) => setNewZoneData(prev => ({ ...prev, radius: e.target.value }))}
                inputProps={{ min: 50, max: 10000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={2}
                value={newZoneData.description}
                onChange={(e) => setNewZoneData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this zone..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setContextMenuOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateZone}
            variant="contained"
            startIcon={<AddIcon />}
            color={newZoneData.zoneType === 'SAFE' ? 'success' : 'warning'}
          >
            Create {newZoneData.zoneType === 'SAFE' ? 'Safe' : 'Risk'} Zone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Selected Attraction Details (keeping existing functionality) */}
      {selectedAttraction && (
        <Card sx={{ position: 'absolute', bottom: 10, left: 10, width: 300, zIndex: 1000 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {getAttractionIcon(selectedAttraction.type)} {selectedAttraction.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {selectedAttraction.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={selectedAttraction.riskLevel}
                size="small"
                color={selectedAttraction.riskLevel === 'LOW' ? 'success' : 
                       selectedAttraction.riskLevel === 'MODERATE' ? 'warning' : 'error'}
              />
              <Button
                size="small"
                onClick={() => setSelectedAttraction(null)}
              >
                Close
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TouristRegionMap;
