import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Locate,
  ZoomIn,
  ZoomOut,
  Layers,
  Compass,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { GpsCoordinate } from '../types';
import { MAP_ID, MAPS_USAGE_ATTRIBUTION } from '../config/maps';

export interface GoogleMapViewProps {
  currentPosition?: { latitude: number; longitude: number; accuracy?: number | null } | null;
  routeCoordinates?: GpsCoordinate[];
  isTracking?: boolean;
  height?: string;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
  autoCenterDefault?: boolean;
  defaultMapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  showLayerButton?: boolean;
}

// Inner helper component to draw route polylines
const RoutePolyline: React.FC<{ coordinates: { lat: number; lng: number }[]; color?: string; weight?: number }> = ({
  coordinates,
  color = '#FF6B24',
  weight = 5
}) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    if (coordinates.length === 0) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path: coordinates,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: weight,
        map
      });
    } else {
      polylineRef.current.setPath(coordinates);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, coordinates, color, weight]);

  return null;
};

// Inner helper to display traffic layer
const TrafficLayerComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null);
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
};

// Inner helper to display transit layer
const TransitLayerComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!transitLayerRef.current) {
        transitLayerRef.current = new google.maps.TransitLayer();
      }
      transitLayerRef.current.setMap(map);
    } else if (transitLayerRef.current) {
      transitLayerRef.current.setMap(null);
    }

    return () => {
      if (transitLayerRef.current) {
        transitLayerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
};

// Inner helper to display GPS accuracy radius
const AccuracyRadius: React.FC<{ center: { lat: number; lng: number }; radius: number }> = ({ center, radius }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        center,
        radius: Math.min(radius, 120),
        fillColor: '#FF6B24',
        fillOpacity: 0.12,
        strokeColor: '#FF6B24',
        strokeWeight: 1,
        strokeOpacity: 0.8,
        map
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(Math.min(radius, 120));
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center, radius]);

  return null;
};

// Inner controller for centering and bounding
const MapController: React.FC<{
  currentPosition?: { latitude: number; longitude: number } | null;
  routeCoordinates?: GpsCoordinate[];
  isFollowingUser: boolean;
  setIsFollowingUser: (v: boolean) => void;
  triggerRecenterCount: number;
}> = ({
  currentPosition,
  routeCoordinates,
  isFollowingUser,
  setIsFollowingUser,
  triggerRecenterCount
}) => {
  const map = useMap();

  // Listen to user drag/pan to disable follow mode
  useEffect(() => {
    if (!map) return;
    const dragListener = map.addListener('dragstart', () => {
      setIsFollowingUser(false);
    });
    return () => {
      google.maps.event.removeListener(dragListener);
    };
  }, [map, setIsFollowingUser]);

  // Recenter when requested or tracking
  useEffect(() => {
    if (!map) return;
    if (currentPosition && isFollowingUser) {
      map.panTo({ lat: currentPosition.latitude, lng: currentPosition.longitude });
    }
  }, [map, currentPosition, isFollowingUser]);

  // Handle explicit recenter click
  useEffect(() => {
    if (!map || triggerRecenterCount === 0) return;
    if (currentPosition) {
      map.setZoom(17);
      map.panTo({ lat: currentPosition.latitude, lng: currentPosition.longitude });
    } else if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      routeCoordinates.forEach(c => bounds.extend({ lat: c.latitude, lng: c.longitude }));
      map.fitBounds(bounds, 40);
    }
  }, [triggerRecenterCount]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  currentPosition,
  routeCoordinates = [],
  isTracking = false,
  height = 'h-full',
  className = '',
  showControls = true,
  interactive = true,
  autoCenterDefault = true,
  defaultMapType = 'roadmap',
  showLayerButton = true
}) => {
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>(defaultMapType);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [transitEnabled, setTransitEnabled] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(autoCenterDefault);
  const [showLayerDrawer, setShowLayerDrawer] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  // Compute initial center
  const initialLat = currentPosition?.latitude ?? (routeCoordinates[0]?.latitude || 40.7128);
  const initialLng = currentPosition?.longitude ?? (routeCoordinates[0]?.longitude || -74.006);

  // Convert route coordinates to LatLng literals
  const pathPoints = routeCoordinates.map(c => ({
    lat: c.latitude,
    lng: c.longitude
  }));

  const startCoord = routeCoordinates.length > 0 ? routeCoordinates[0] : null;

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-3xl select-none ${className}`}>
      <Map
        mapId={MAP_ID}
        defaultCenter={{ lat: initialLat, lng: initialLng }}
        defaultZoom={16}
        gestureHandling={interactive ? 'greedy' : 'none'}
        disableDefaultUI={true}
        mapTypeId={mapTypeId}
        internalUsageAttributionIds={MAPS_USAGE_ATTRIBUTION}
        className="w-full h-full z-0"
      >
        {/* Route Polyline */}
        <RoutePolyline coordinates={pathPoints} color="#FF6B24" weight={5} />

        {/* Traffic Layer */}
        <TrafficLayerComponent enabled={trafficEnabled} />

        {/* Transit Layer */}
        <TransitLayerComponent enabled={transitEnabled} />

        {/* Start Point Pin (Green dot) */}
        {startCoord && (
          <AdvancedMarker
            position={{ lat: startCoord.latitude, lng: startCoord.longitude }}
            title="Start Point"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#249B61] border-2 border-white shadow-md" />
          </AdvancedMarker>
        )}

        {/* Current Position Marker (Vibrant Athletic Target) */}
        {currentPosition && (
          <AdvancedMarker
            position={{ lat: currentPosition.latitude, lng: currentPosition.longitude }}
            title="Current GPS Location"
            zIndex={1000}
          >
            <div className="relative w-7 h-7 flex items-center justify-center pointer-events-none">
              <div className="absolute w-7 h-7 rounded-full bg-[#FF6B24]/30 animate-ping" />
              <div className="w-4 h-4 rounded-full bg-[#FF6B24] border-2 border-white shadow-lg relative z-10" />
            </div>
          </AdvancedMarker>
        )}

        {/* GPS Accuracy Circle */}
        {currentPosition && currentPosition.accuracy && currentPosition.accuracy > 0 && (
          <AccuracyRadius
            center={{ lat: currentPosition.latitude, lng: currentPosition.longitude }}
            radius={currentPosition.accuracy}
          />
        )}

        {/* Dynamic Center and Follow Controller */}
        <MapController
          currentPosition={currentPosition}
          routeCoordinates={routeCoordinates}
          isFollowingUser={isFollowingUser}
          setIsFollowingUser={setIsFollowingUser}
          triggerRecenterCount={recenterCount}
        />
      </Map>

      {/* Floating Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2.5">
          {/* Layer Selector Toggle */}
          {showLayerButton && (
            <button
              onClick={() => setShowLayerDrawer(prev => !prev)}
              className="w-10 h-10 rounded-2xl bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/85 transition-colors shadow-lg cursor-pointer"
              title="Google Map Layers & Types"
              aria-label="Map Layers"
            >
              <Layers className="w-4 h-4 text-[var(--accent-orange)]" />
            </button>
          )}

          {/* Re-center / Follow GPS Button */}
          <button
            onClick={() => {
              setIsFollowingUser(true);
              setRecenterCount(c => c + 1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer text-xs font-bold ${
              isFollowingUser
                ? 'bg-[var(--accent-orange)] text-white shadow-[0_4px_16px_rgba(255,107,36,0.4)]'
                : 'bg-black/70 text-white hover:bg-black/85'
            }`}
            title="Center and follow location"
          >
            <Locate className={`w-4 h-4 ${isFollowingUser ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {isFollowingUser ? 'Tracking' : 'Center on Me'}
            </span>
          </button>
        </div>
      )}

      {/* Map Layers Drawer */}
      {showLayerDrawer && (
        <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-64 z-30 p-3.5 rounded-3xl bg-black/85 backdrop-blur-xl border border-white/10 text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--accent-orange)]">
              Map Style
            </span>
            <button
              onClick={() => setShowLayerDrawer(false)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Map Types */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { id: 'roadmap', label: 'Standard' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'terrain', label: 'Terrain' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setMapTypeId(t.id as any)}
                className={`py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  mapTypeId === t.id
                    ? 'bg-[var(--accent-orange)] text-white shadow-sm'
                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Map Overlays (Traffic, Transit) */}
          <div className="space-y-1.5 pt-1 border-t border-white/10 text-xs">
            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer">
              <span className="font-medium text-stone-200">Traffic Layer</span>
              <input
                type="checkbox"
                checked={trafficEnabled}
                onChange={e => setTrafficEnabled(e.target.checked)}
                className="accent-[var(--accent-orange)] rounded w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer">
              <span className="font-medium text-stone-200">Transit Lines</span>
              <input
                type="checkbox"
                checked={transitEnabled}
                onChange={e => setTransitEnabled(e.target.checked)}
                className="accent-[var(--accent-orange)] rounded w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
