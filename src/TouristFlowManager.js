import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Refresh,
  Timeline,
  TrendingUp,
  People,
  Place,
  Visibility,
  VisibilityOff,
  Layers,
  FilterList,
  Map as MapIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';

function Heatmap({ points, options }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const heatLayer = L.heatLayer(points, options).addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [map, points, options]);
  return null;
}



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons for different tourist flow intensities
const createCustomIcon = (color, intensity) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
        <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
        <text x="12.5" y="16" text-anchor="middle" fill="${color}" font-size="8" font-weight="bold">${intensity}</text>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const TouristFlowManager = () => {
  const mapRef = useRef();
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [selectedFlowType, setSelectedFlowType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all'); // New state for region selection
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showFlowLines, setShowFlowLines] = useState(false);

  // Enhanced tourist flow data with more detailed heat map points
  const [touristFlowData] = useState({
    hotspots: [
      // Assam
      { id: 1, name: "Kamakhya Temple", lat: 26.1667, lng: 91.7000, intensity: 95, visitors: 1200, state: "Assam", region: "assam" },
      { id: 2, name: "Kaziranga National Park", lat: 26.5775, lng: 93.1714, intensity: 88, visitors: 950, state: "Assam", region: "assam" },
      { id: 3, name: "Majuli Island", lat: 27.0230, lng: 94.2026, intensity: 72, visitors: 650, state: "Assam", region: "assam" },
      
      // Meghalaya
      { id: 4, name: "Cherrapunji", lat: 25.3000, lng: 91.7000, intensity: 85, visitors: 800, state: "Meghalaya", region: "meghalaya" },
      { id: 5, name: "Shillong", lat: 25.5788, lng: 91.8933, intensity: 78, visitors: 720, state: "Meghalaya", region: "meghalaya" },
      { id: 6, name: "Dawki River", lat: 25.1167, lng: 91.7667, intensity: 68, visitors: 540, state: "Meghalaya", region: "meghalaya" },
      
      // Sikkim
      { id: 7, name: "Gangtok", lat: 27.3389, lng: 88.6065, intensity: 82, visitors: 890, state: "Sikkim", region: "sikkim" },
      { id: 8, name: "Nathula Pass", lat: 27.3911, lng: 88.8407, intensity: 75, visitors: 680, state: "Sikkim", region: "sikkim" },
      
      // Arunachal Pradesh
      { id: 9, name: "Tawang Monastery", lat: 27.5860, lng: 91.8567, intensity: 70, visitors: 580, state: "Arunachal", region: "arunachal" },
      { id: 10, name: "Itanagar", lat: 27.0844, lng: 93.6053, intensity: 65, visitors: 450, state: "Arunachal", region: "arunachal" },
      
      // Manipur
      { id: 11, name: "Loktak Lake", lat: 24.5167, lng: 93.7833, intensity: 73, visitors: 620, state: "Manipur", region: "manipur" },
      
      // Nagaland
      { id: 12, name: "Kohima", lat: 25.6701, lng: 94.1077, intensity: 67, visitors: 480, state: "Nagaland", region: "nagaland" },
      
      // Tripura
      { id: 13, name: "Agartala", lat: 23.8315, lng: 91.2868, intensity: 60, visitors: 380, state: "Tripura", region: "tripura" },
    ],
    flowPaths: [
      { from: [26.1667, 91.7000], to: [26.5775, 93.1714], flow: 340, route: "Guwahati to Kaziranga" },
      { from: [25.5788, 91.8933], to: [25.3000, 91.7000], flow: 280, route: "Shillong to Cherrapunji" },
      { from: [27.3389, 88.6065], to: [27.5860, 91.8567], flow: 220, route: "Gangtok to Tawang" },
      { from: [26.1667, 91.7000], to: [25.5788, 91.8933], flow: 190, route: "Guwahati to Shillong" },
    ]
  });

  // Regional heat map data - more dense point data for heat maps
  const [regionalHeatmapData] = useState({
    all: [
      // All regions combined with density points
      [26.1667, 91.7000, 0.95], [26.1700, 91.7050, 0.85], [26.1650, 91.6950, 0.90],
      [26.5775, 93.1714, 0.88], [26.5800, 93.1750, 0.82], [26.5750, 93.1680, 0.85],
      [25.5788, 91.8933, 0.78], [25.5820, 91.8950, 0.75], [25.5750, 91.8900, 0.80],
      [27.3389, 88.6065, 0.82], [27.3420, 88.6100, 0.78], [27.3350, 88.6030, 0.85],
      [25.3000, 91.7000, 0.85], [25.3050, 91.7050, 0.80], [25.2950, 91.6950, 0.88],
    ],
    assam: [
      // Dense heat map points for Assam region
      [26.1667, 91.7000, 0.95], [26.1700, 91.7050, 0.85], [26.1650, 91.6950, 0.90], [26.1720, 91.7080, 0.80],
      [26.5775, 93.1714, 0.88], [26.5800, 93.1750, 0.82], [26.5750, 93.1680, 0.85], [26.5820, 93.1780, 0.78],
      [27.0230, 94.2026, 0.72], [27.0250, 94.2050, 0.68], [27.0200, 94.2000, 0.75], [27.0280, 94.2080, 0.65],
      [26.2000, 91.7300, 0.65], [26.2500, 92.0000, 0.60], [26.3000, 92.5000, 0.55],
      [26.4000, 93.0000, 0.70], [26.6000, 93.2000, 0.75], [26.8000, 93.5000, 0.60],
    ],
    meghalaya: [
      // Dense heat map points for Meghalaya
      [25.5788, 91.8933, 0.78], [25.5820, 91.8950, 0.75], [25.5750, 91.8900, 0.80], [25.5850, 91.8980, 0.70],
      [25.3000, 91.7000, 0.85], [25.3050, 91.7050, 0.80], [25.2950, 91.6950, 0.88], [25.3100, 91.7100, 0.75],
      [25.1167, 91.7667, 0.68], [25.1200, 91.7700, 0.65], [25.1130, 91.7630, 0.70], [25.1250, 91.7750, 0.60],
      [25.4000, 91.8000, 0.60], [25.4500, 91.8500, 0.55], [25.2000, 91.6000, 0.75],
      [25.6000, 91.9000, 0.65], [25.1000, 91.5000, 0.70],
    ],
    sikkim: [
      // Dense heat map points for Sikkim
      [27.3389, 88.6065, 0.82], [27.3420, 88.6100, 0.78], [27.3350, 88.6030, 0.85], [27.3450, 88.6130, 0.75],
      [27.3911, 88.8407, 0.75], [27.3940, 88.8440, 0.72], [27.3880, 88.8370, 0.78], [27.3970, 88.8470, 0.68],
      [27.2000, 88.4000, 0.60], [27.4000, 88.7000, 0.65], [27.5000, 88.9000, 0.55],
      [27.1000, 88.3000, 0.58], [27.6000, 89.0000, 0.50],
    ],
    arunachal: [
      // Dense heat map points for Arunachal Pradesh
      [27.5860, 91.8567, 0.70], [27.5890, 91.8600, 0.68], [27.5830, 91.8530, 0.72], [27.5920, 91.8630, 0.65],
      [27.0844, 93.6053, 0.65], [27.0870, 93.6080, 0.62], [27.0820, 93.6020, 0.68], [27.0900, 93.6110, 0.58],
      [27.3000, 92.0000, 0.55], [27.8000, 95.0000, 0.45], [28.0000, 95.5000, 0.40],
      [26.8000, 93.0000, 0.50], [27.5000, 94.0000, 0.60],
    ],
    manipur: [
      // Dense heat map points for Manipur
      [24.5167, 93.7833, 0.73], [24.5200, 93.7860, 0.70], [24.5130, 93.7800, 0.76], [24.5230, 93.7890, 0.68],
      [24.8170, 93.9368, 0.60], [24.8200, 93.9400, 0.58], [24.8140, 93.9330, 0.62],
      [24.6000, 93.8000, 0.55], [24.4000, 93.7000, 0.65], [24.7000, 93.9000, 0.50],
    ],
    nagaland: [
      // Dense heat map points for Nagaland
      [25.6701, 94.1077, 0.67], [25.6730, 94.1110, 0.64], [25.6670, 94.1040, 0.70], [25.6760, 94.1140, 0.60],
      [26.1584, 94.5624, 0.55], [26.1610, 94.5650, 0.52], [26.1550, 94.5590, 0.58],
      [25.8000, 94.2000, 0.50], [25.5000, 94.0000, 0.60], [26.0000, 94.4000, 0.45],
    ],
    tripura: [
      // Dense heat map points for Tripura
      [23.8315, 91.2868, 0.60], [23.8340, 91.2900, 0.58], [23.8290, 91.2830, 0.62], [23.8370, 91.2930, 0.55],
      [23.9513, 91.9882, 0.45], [23.9540, 91.9910, 0.42], [23.9480, 91.9850, 0.48],
      [23.7000, 91.1000, 0.50], [24.0000, 92.0000, 0.40], [23.6000, 91.3000, 0.55],
    ],
  });

  // Region definitions for map centering
  const regionCenters = {
    all: { center: [26.2006, 92.9376], zoom: 7 },
    assam: { center: [26.2006, 92.9376], zoom: 8 },
    meghalaya: { center: [25.4670, 91.3662], zoom: 9 },
    sikkim: { center: [27.5330, 88.5122], zoom: 10 },
    arunachal: { center: [28.2180, 94.7278], zoom: 8 },
    manipur: { center: [24.6637, 93.9063], zoom: 9 },
    nagaland: { center: [26.1584, 94.5624], zoom: 9 },
    tripura: { center: [23.9408, 91.9882], zoom: 10 },
  };

  const [analytics] = useState({
    totalVisitors: 8940,
    peakHours: '10:00 AM - 2:00 PM',
    topDestination: 'Kamakhya Temple',
    growthRate: '+12.5%'
  });

  useEffect(() => {
    setTimeout(() => {
      setMapReady(true);
    }, 500);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const getMarkerColor = (intensity) => {
    if (intensity >= 80) return '#ff4444';
    if (intensity >= 60) return '#ff9800';
    return '#4caf50';
  };

  const getIntensityLevel = (intensity) => {
    if (intensity >= 80) return 'High';
    if (intensity >= 60) return 'Medium';
    return 'Low';
  };

  const filteredHotspots = touristFlowData.hotspots.filter(spot => {
    let matchesFlowType = true;
    let matchesRegion = true;

    if (selectedFlowType !== 'all') {
      const level = getIntensityLevel(spot.intensity).toLowerCase();
      matchesFlowType = level === selectedFlowType;
    }

    if (selectedRegion !== 'all') {
      matchesRegion = spot.region === selectedRegion;
    }

    return matchesFlowType && matchesRegion;
  });

  // Get heat map data based on selected region
  const getHeatmapData = () => {
    return regionalHeatmapData[selectedRegion] || regionalHeatmapData.all;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            🌊 Tourist Flow Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time tourist movement patterns and regional heat maps for Northeast India
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh sx={{ transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {analytics.totalVisitors.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Visitors
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {analytics.peakHours}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Peak Hours
                  </Typography>
                </Box>
                <Timeline sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {analytics.topDestination}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Top Destination
                  </Typography>
                </Box>
                <Place sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {analytics.growthRate}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Growth Rate
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Region"
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <MenuItem value="all">All Northeast</MenuItem>
                <MenuItem value="assam">Assam</MenuItem>
                <MenuItem value="meghalaya">Meghalaya</MenuItem>
                <MenuItem value="sikkim">Sikkim</MenuItem>
                <MenuItem value="arunachal">Arunachal Pradesh</MenuItem>
                <MenuItem value="manipur">Manipur</MenuItem>
                <MenuItem value="nagaland">Nagaland</MenuItem>
                <MenuItem value="tripura">Tripura</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                label="Time Range"
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Flow Intensity</InputLabel>
              <Select
                value={selectedFlowType}
                label="Flow Intensity"
                onChange={(e) => setSelectedFlowType(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="high">High Flow</MenuItem>
                <MenuItem value="medium">Medium Flow</MenuItem>
                <MenuItem value="low">Low Flow</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  color="primary"
                />
              }
              label="Heat Map"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  color="primary"
                />
              }
              label="Markers"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showFlowLines}
                  onChange={(e) => setShowFlowLines(e.target.checked)}
                  color="primary"
                />
              }
              label="Flow Lines"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Map with Heat Map Layer */}
      <Paper sx={{ height: 600, overflow: 'hidden', borderRadius: 2 }}>
        {!mapReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Map...</Typography>
          </Box>
        ) : (
          <MapContainer
            center={regionCenters[selectedRegion]?.center || [26.2006, 92.9376]}
            zoom={regionCenters[selectedRegion]?.zoom || 7}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>

              {/* Regional Heat Map Layer */}
              {showHeatmap && (
  <LayersControl.Overlay checked name="Tourist Flow Heatmap">
    <Heatmap
      points={getHeatmapData()}
      options={{
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {0.4:'blue',0.6:'cyan',0.7:'lime',0.8:'yellow',1:'red'}
      }}
    />
  </LayersControl.Overlay>
)}


              {/* Tourist Flow Markers */}
              {showMarkers && (
                <LayersControl.Overlay name="Tourist Hotspots">
                  <>
                    {filteredHotspots.map((spot) => (
                      <Marker
                        key={spot.id}
                        position={[spot.lat, spot.lng]}
                        icon={createCustomIcon(getMarkerColor(spot.intensity), Math.round(spot.intensity / 10))}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="h6" gutterBottom>
                              {spot.name}
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body2" gutterBottom>
                              <strong>State:</strong> {spot.state}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Current Visitors:</strong> {spot.visitors}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Flow Intensity:</strong> 
                              <Chip 
                                label={`${getIntensityLevel(spot.intensity)} (${spot.intensity}%)`}
                                color={
                                  spot.intensity >= 80 ? 'error' : 
                                  spot.intensity >= 60 ? 'warning' : 'success'
                                }
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                </LayersControl.Overlay>
              )}

              {/* Flow Lines */}
              {showFlowLines && (
                <LayersControl.Overlay name="Tourist Flow Routes">
                  <>
                    {touristFlowData.flowPaths.map((path, index) => (
                      <Polyline
                        key={index}
                        positions={[path.from, path.to]}
                        color={path.flow > 250 ? '#ff4444' : path.flow > 150 ? '#ff9800' : '#4caf50'}
                        weight={Math.max(2, path.flow / 100)}
                        opacity={0.7}
                      >
                        <Popup>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              {path.route}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Daily Flow:</strong> {path.flow} tourists
                            </Typography>
                          </Box>
                        </Popup>
                      </Polyline>
                    ))}
                  </>
                </LayersControl.Overlay>
              )}

              {/* Flow Intensity Zones */}
              <LayersControl.Overlay name="Flow Intensity Zones">
                <>
                  {filteredHotspots.map((spot) => (
                    <Circle
                      key={`circle-${spot.id}`}
                      center={[spot.lat, spot.lng]}
                      radius={spot.intensity * 100}
                      fillColor={getMarkerColor(spot.intensity)}
                      fillOpacity={0.2}
                      stroke={true}
                      color={getMarkerColor(spot.intensity)}
                      weight={2}
                    />
                  ))}
                </>
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        )}
      </Paper>

      {/* Enhanced Legend */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Legend
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Flow Intensity Markers
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#ff4444' }} />
                <Typography variant="body2">High Flow (80%+)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#ff9800' }} />
                <Typography variant="body2">Medium Flow (60-79%)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50' }} />
                <Typography variant="body2">Low Flow (&lt;60%)</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Heat Map Gradient
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 200, 
                  height: 20, 
                  background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)',
                  borderRadius: 1
                }} 
              />
              <Typography variant="body2">Tourist Density</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TouristFlowManager;
