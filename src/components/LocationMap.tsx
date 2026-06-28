import { useEffect, useMemo } from 'react';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { formatCoord, isValidCoords, parseCoord } from '../coords';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationMapProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
}

interface MapControllerProps {
  lat: number;
  lng: number;
}

function MapController({ lat, lng }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
  }, [lat, lng, map]);

  return null;
}

interface MapEventsProps {
  onMove: (lat: number, lng: number) => void;
}

function MapEvents({ onMove }: MapEventsProps) {
  useMapEvents({
    click(event) {
      onMove(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationMap({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onSearch,
  loading,
}: LocationMapProps) {
  const parsedLat = parseCoord(latitude);
  const parsedLng = parseCoord(longitude);
  const coordsValid = isValidCoords(latitude, longitude);

  const position = useMemo<[number, number]>(() => {
    if (coordsValid && parsedLat !== null && parsedLng !== null) {
      return [parsedLat, parsedLng];
    }
    return [35.7711, 51.4322];
  }, [coordsValid, parsedLat, parsedLng]);

  const updatePosition = (lat: number, lng: number) => {
    onLatitudeChange(formatCoord(lat));
    onLongitudeChange(formatCoord(lng));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Geolocation errors are handled silently; user can pick on map.
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          gap: 1,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <MapIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              انتخاب موقعیت روی نقشه
            </Typography>
            <Typography variant="caption" color="text.secondary">
              روی نقشه کلیک کنید یا مارکر را بکشید
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip
            icon={<TouchAppIcon sx={{ fontSize: '16px !important' }} />}
            label={`${latitude || '—'} , ${longitude || '—'}`}
            size="small"
            sx={{ fontFamily: 'monospace', direction: 'ltr' }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<GpsFixedIcon />}
            onClick={handleUseMyLocation}
          >
            موقعیت من
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<MyLocationIcon />}
            onClick={onSearch}
            disabled={loading || !coordsValid}
          >
            جستجو
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: { xs: 280, sm: 340, md: 380 }, width: '100%' }}>
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController lat={position[0]} lng={position[1]} />
          <MapEvents onMove={updatePosition} />
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const { lat, lng } = marker.getLatLng();
                updatePosition(lat, lng);
              },
            }}
          />
        </MapContainer>
      </Box>
    </Paper>
  );
}
