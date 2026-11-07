import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Search,
  Layers,
  MapPin,
  Navigation,
  Compass,
  Check,
  X,
  RotateCcw,
  TreePine,
  Dumbbell,
  Bike,
  Mountain,
  Trophy,
  Activity,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Info,
  Star,
  Locate
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NearbyPlaceCategory, ActivityType } from '../../types';
import { getActivityIcon } from '../../utils/activityModes';
import { MAP_ID, MAPS_USAGE_ATTRIBUTION } from '../../config/maps';

export interface GooglePlaceResult {
  id: string;
  name: string;
  category: NearbyPlaceCategory;
  lat: number;
  lng: number;
  distanceMeters?: number;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
}

const NEARBY_CATEGORIES: { category: NearbyPlaceCategory; label: string; icon: any; types: string[]; query: string }[] = [
  { category: 'Parks', label: 'Parks', icon: TreePine, types: ['park'], query: 'park' },
  { category: 'Running Tracks', label: 'Running Tracks', icon: Activity, types: ['athletic_field', 'stadium'], query: 'running track' },
  { category: 'Stadiums', label: 'Stadiums', icon: Trophy, types: ['stadium'], query: 'stadium' },
  { category: 'Gyms', label: 'Gyms', icon: Dumbbell, types: ['gym'], query: 'fitness center gym' },
  { category: 'Sports Grounds', label: 'Sports Grounds', icon: Trophy, types: ['sports_complex'], query: 'sports ground' },
  { category: 'Cycling Routes', label: 'Cycling Routes', icon: Bike, types: ['bicycle_store'], query: 'bike trail cycling route' },
  { category: 'Hiking Trails', label: 'Hiking Trails', icon: Mountain, types: ['campground'], query: 'hiking trail nature reserve' }
];

// Inner helper component to draw user workout routes
const UserRoutePolylines: React.FC<{
  activities: any[];
  showRoutes: boolean;
  filterMode: ActivityType | 'All';
  onSelectRoute?: (activity: any) => void;
}> = ({ activities, showRoutes, filterMode }) => {
  const map = useMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clean up previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (!showRoutes) return;

    activities.forEach((act) => {
      if (filterMode !== 'All' && act.activityType !== filterMode) return;
      if (!act.coordinates || act.coordinates.length < 2) return;

      const path = act.coordinates.map((c: any) => ({ lat: c.latitude, lng: c.longitude }));
      const poly = new google.maps.Polyline({
        path,
        strokeColor: '#FF6B24',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map
      });

      polylinesRef.current.push(poly);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, activities, showRoutes, filterMode]);

  return null;
};

// Inner helper component for Traffic Layer
const TrafficLayerComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const layerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TrafficLayer();
      }
      layerRef.current.setMap(map);
    } else if (layerRef.current) {
      layerRef.current.setMap(null);
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
};

// Inner helper component for Transit Layer
const TransitLayerComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const layerRef = useRef<google.maps.TransitLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TransitLayer();
      }
      layerRef.current.setMap(map);
    } else if (layerRef.current) {
      layerRef.current.setMap(null);
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
};

// Inner helper component for map center tracking
const MapCenterTracker: React.FC<{
  onCenterChange: (center: { lat: number; lng: number }) => void;
}> = ({ onCenterChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      const c = map.getCenter();
      if (c) {
        onCenterChange({ lat: c.lat(), lng: c.lng() });
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onCenterChange]);

  return null;
};

export const ExploreScreen: React.FC = () => {
  const { activities, formatDistance } = useApp();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  // States
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>(() => {
    const saved = localStorage.getItem('hypeathe_google_map_type');
    return (saved as any) || 'roadmap';
  });

  const [activeSheet, setActiveSheet] = useState<'none' | 'mapType' | 'nearby' | 'layers' | 'routes'>('none');
  const [selectedNearbyCategories, setSelectedNearbyCategories] = useState<NearbyPlaceCategory[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<GooglePlaceResult[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(null);

  // Layer toggles
  const [layerTraffic, setLayerTraffic] = useState(false);
  const [layerTransit, setLayerTransit] = useState(false);

  // User routes filter state
  const [showUserRoutes, setShowUserRoutes] = useState(true);
  const [userRouteActivityFilter, setUserRouteActivityFilter] = useState<ActivityType | 'All'>('All');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPinLocation, setSearchPinLocation] = useState<{ lat: number; lng: number; title: string } | null>(null);

  // User GPS position
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7829, lng: -73.9654 });
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7829, lng: -73.9654 });
  const [userLocationAcquired, setUserLocationAcquired] = useState(false);

  // Initial GPS locate
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCenter(loc);
          setCurrentMapCenter(loc);
          setUserLocationAcquired(true);
          if (map) {
            map.panTo(loc);
            map.setZoom(15);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [map]);

  // Handle map type changes
  const handleMapTypeChange = (newType: 'roadmap' | 'satellite' | 'terrain' | 'hybrid') => {
    setMapTypeId(newType);
    localStorage.setItem('hypeathe_google_map_type', newType);
  };

  // Query Real Nearby Places using Google Places API (New) with fallback
  const fetchNearbyPlaces = useCallback(async () => {
    if (!map || !placesLib || selectedNearbyCategories.length === 0) {
      setNearbyPlaces([]);
      return;
    }

    setIsLoadingNearby(true);
    const center = map.getCenter() || new google.maps.LatLng(userCenter.lat, userCenter.lng);
    const centerLiteral = {
      lat: typeof center.lat === 'function' ? center.lat() : (center as any).lat,
      lng: typeof center.lng === 'function' ? center.lng() : (center as any).lng,
    };
    const radiusMeters = 5000;

    const collectedResults: GooglePlaceResult[] = [];
    const seenPlaceIds = new Set<string>();
    const activeConfigs = NEARBY_CATEGORIES.filter(c => selectedNearbyCategories.includes(c.category));

    // Prefer Places API (New) Place.searchNearby / Place.searchByText
    if ((placesLib as any).Place?.searchNearby || (placesLib as any).Place?.searchByText) {
      try {
        for (const catConfig of activeConfigs) {
          try {
            let places: any[] = [];
            if ((placesLib as any).Place.searchNearby && catConfig.types.length > 0) {
              const res = await (placesLib as any).Place.searchNearby({
                locationRestriction: {
                  center: centerLiteral,
                  radius: radiusMeters
                },
                includedTypes: catConfig.types,
                maxResultCount: 8,
                fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount']
              });
              places = res.places || [];
            }

            if (places.length === 0 && (placesLib as any).Place.searchByText) {
              const res = await (placesLib as any).Place.searchByText({
                textQuery: catConfig.query,
                locationBias: {
                  center: centerLiteral,
                  radius: radiusMeters
                },
                maxResultCount: 8,
                fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount']
              });
              places = res.places || [];
            }

            for (const place of places) {
              if (place.id && !seenPlaceIds.has(place.id) && place.location) {
                seenPlaceIds.add(place.id);
                const pLat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
                const pLng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
                const distM = Math.round(
                  google.maps.geometry?.spherical
                    ? google.maps.geometry.spherical.computeDistanceBetween(center, place.location)
                    : 1000
                );
                collectedResults.push({
                  id: place.id,
                  name: place.displayName || `${catConfig.label} Point`,
                  category: catConfig.category,
                  lat: pLat,
                  lng: pLng,
                  distanceMeters: distM,
                  address: place.formattedAddress,
                  rating: place.rating,
                  userRatingsTotal: place.userRatingCount
                });
              }
            }
          } catch (itemErr) {
            console.warn(`Places search error for ${catConfig.label}:`, itemErr);
          }
        }

        if (collectedResults.length > 0 || !(placesLib as any).PlacesService) {
          setNearbyPlaces(collectedResults);
          setIsLoadingNearby(false);
          return;
        }
      } catch (err) {
        console.warn('Modern Places API query attempt, trying fallback:', err);
      }
    }

    // Fallback to PlacesService if supported in current runtime
    if ((placesLib as any).PlacesService) {
      try {
        const placesService = new (placesLib as any).PlacesService(map);
        const promises = activeConfigs.map(catConfig => {
          return new Promise<void>((resolve) => {
            const request: any = {
              location: center,
              radius: radiusMeters,
              keyword: catConfig.query
            };
            if (catConfig.types.length > 0) {
              request.type = catConfig.types[0];
            }
            placesService.nearbySearch(request, (results: any[], status: any) => {
              if (status === (placesLib as any).PlacesServiceStatus?.OK && results) {
                results.slice(0, 8).forEach(place => {
                  if (place.place_id && !seenPlaceIds.has(place.place_id) && place.geometry?.location) {
                    seenPlaceIds.add(place.place_id);
                    const pLat = place.geometry.location.lat();
                    const pLng = place.geometry.location.lng();
                    const distM = Math.round(
                      google.maps.geometry?.spherical
                        ? google.maps.geometry.spherical.computeDistanceBetween(center, place.geometry.location)
                        : 1000
                    );
                    collectedResults.push({
                      id: place.place_id,
                      name: place.name || `${catConfig.label} Point`,
                      category: catConfig.category,
                      lat: pLat,
                      lng: pLng,
                      distanceMeters: distM,
                      address: place.vicinity,
                      rating: place.rating,
                      userRatingsTotal: place.user_ratings_total
                    });
                  }
                });
              }
              resolve();
            });
          });
        });
        await Promise.all(promises);
        setNearbyPlaces(collectedResults);
      } catch (err) {
        console.warn('Google Places legacy query error:', err);
      }
    }

    setIsLoadingNearby(false);
  }, [map, placesLib, selectedNearbyCategories, userCenter]);

  useEffect(() => {
    fetchNearbyPlaces();
  }, [fetchNearbyPlaces]);

  // Search using Places API (New) searchByText with Geocoder fallback
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !map) return;

    setIsSearching(true);
    setSearchError(null);

    // Modern Place.searchByText
    if ((placesLib as any)?.Place?.searchByText) {
      try {
        const res = await (placesLib as any).Place.searchByText({
          textQuery: searchQuery,
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
          locationBias: map.getCenter() || undefined
        });

        if (res.places && res.places.length > 0) {
          const first = res.places[0];
          const lat = typeof first.location?.lat === 'function' ? first.location.lat() : first.location?.lat;
          const lng = typeof first.location?.lng === 'function' ? first.location.lng() : first.location?.lng;
          if (lat != null && lng != null) {
            map.panTo({ lat, lng });
            map.setZoom(15);
            setSearchPinLocation({ lat, lng, title: first.displayName || first.formattedAddress || searchQuery });
            setSearchSuggestions([]);
            setIsSearching(false);
            return;
          }
        }
      } catch (placeErr) {
        console.warn('Place.searchByText failed, falling back:', placeErr);
      }
    }

    // Geocoder fallback
    if (geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results && results.length > 0) {
          const first = results[0];
          const lat = first.geometry.location.lat();
          const lng = first.geometry.location.lng();
          map.panTo({ lat, lng });
          map.setZoom(15);
          setSearchPinLocation({ lat, lng, title: first.formatted_address });
          setSearchSuggestions([]);
        } else {
          setSearchError('Location not found. Try entering a city, park, or landmark name.');
        }
      });
    } else {
      setIsSearching(false);
      setSearchError('Search service temporarily unavailable.');
    }
  };

  // Re-center on user GPS position
  const handleRecenter = () => {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCenter(latLng);
        setUserLocationAcquired(true);
        map.panTo(latLng);
        map.setZoom(16);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-[var(--bg-main)]">
      {/* 1. Google Maps-Inspired Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex items-center px-4 py-2.5 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[#181A18]/95 backdrop-blur-xl shadow-lg border border-[var(--text-secondary)]/15">
            <Search className="w-4 h-4 text-[var(--accent-orange)] shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, address, park, trail..."
              className="w-full bg-transparent text-xs md:text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchSuggestions([]);
                  setSearchPinLocation(null);
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-1 cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="ml-2 px-3 py-1 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSearching ? '...' : 'Go'}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-rose-950/80 text-rose-300 text-xs flex items-center gap-1.5 shadow-md">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* 2. Floating Action Controls on Right Side (Google Maps style) */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Map Type Button */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'mapType' ? 'none' : 'mapType')}
          className={`w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
            activeSheet === 'mapType'
              ? 'bg-[var(--accent-orange)] text-white shadow-lg'
              : 'bg-[var(--bg-secondary)] dark:bg-[#181A18]/90 text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
          title="Map Type (Standard, Satellite, Terrain)"
          aria-label="Map Type"
        >
          <Layers className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Nearby Places Filter Button */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'nearby' ? 'none' : 'nearby')}
          className={`w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
            activeSheet === 'nearby' || selectedNearbyCategories.length > 0
              ? 'bg-[var(--accent-orange)] text-white shadow-lg'
              : 'bg-[var(--bg-secondary)] dark:bg-[#181A18]/90 text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
          title="Nearby Places (Parks, Tracks, Gyms, Trails)"
          aria-label="Nearby Places"
        >
          <TreePine className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Map Layers Filter Button */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'layers' ? 'none' : 'layers')}
          className={`w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
            activeSheet === 'layers' || layerTraffic || layerTransit
              ? 'bg-[var(--accent-orange)] text-white shadow-lg'
              : 'bg-[var(--bg-secondary)] dark:bg-[#181A18]/90 text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
          title="Map Layers (Traffic, Transit)"
          aria-label="Map Layers"
        >
          <Compass className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* User Recorded Routes Toggle */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'routes' ? 'none' : 'routes')}
          className={`w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
            activeSheet === 'routes' || showUserRoutes
              ? 'bg-[var(--bg-surface)] text-[var(--accent-orange)] border border-[var(--accent-orange)]/40 shadow-sm'
              : 'bg-[var(--bg-secondary)] dark:bg-[#181A18]/90 text-[var(--text-secondary)]'
          }`}
          title="Personal Recorded Routes"
          aria-label="Personal Recorded Routes"
        >
          <Activity className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* GPS Re-Center Button */}
        <button
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[#181A18]/90 text-[var(--text-primary)] backdrop-blur-xl flex items-center justify-center hover:bg-[var(--bg-surface)] transition-all shadow-md cursor-pointer"
          title="My Location"
          aria-label="My Location"
        >
          <Navigation className="w-5 h-5 stroke-[2.2] text-[var(--accent-orange)]" />
        </button>
      </div>

      {/* 3. The Main Google Map Container */}
      <Map
        mapId={MAP_ID}
        defaultCenter={userCenter}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={true}
        mapTypeId={mapTypeId}
        internalUsageAttributionIds={MAPS_USAGE_ATTRIBUTION}
        className="w-full h-full z-0"
      >
        {/* User Recorded Routes Polylines */}
        <UserRoutePolylines
          activities={activities}
          showRoutes={showUserRoutes}
          filterMode={userRouteActivityFilter}
        />

        {/* Traffic Layer */}
        <TrafficLayerComponent enabled={layerTraffic} />

        {/* Transit Layer */}
        <TransitLayerComponent enabled={layerTransit} />

        {/* Center change tracking */}
        <MapCenterTracker onCenterChange={setCurrentMapCenter} />

        {/* User Current GPS Position Marker */}
        {userLocationAcquired && (
          <AdvancedMarker position={userCenter} title="Your Location" zIndex={1000}>
            <div className="relative w-7 h-7 flex items-center justify-center pointer-events-none">
              <div className="absolute w-7 h-7 rounded-full bg-[#FF6B24]/30 animate-ping" />
              <div className="w-4 h-4 rounded-full bg-[#FF6B24] border-2 border-white shadow-lg relative z-10" />
            </div>
          </AdvancedMarker>
        )}

        {/* Search Geocoded Pin Marker */}
        {searchPinLocation && (
          <AdvancedMarker
            position={{ lat: searchPinLocation.lat, lng: searchPinLocation.lng }}
            title={searchPinLocation.title}
            zIndex={950}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-orange)] border-2 border-white shadow-xl flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
          </AdvancedMarker>
        )}

        {/* Real Google Places Markers */}
        {nearbyPlaces.map((place) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => {
              setSelectedPlace(place);
              if (map) {
                map.panTo({ lat: place.lat, lng: place.lng });
              }
            }}
          >
            <div className="px-2 py-1 rounded-xl bg-stone-900 border-2 border-[var(--accent-orange)] text-white shadow-xl flex items-center gap-1.5 cursor-pointer hover:scale-110 transition-transform">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
              <span className="text-[10px] font-black max-w-[120px] truncate">{place.name}</span>
            </div>
          </AdvancedMarker>
        ))}
      </Map>

      {/* 4. BOTTOM SHEETS (Google Maps style bottom modals) */}

      {/* A. Map Type Sheet */}
      {activeSheet === 'mapType' && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-t-3xl p-5 shadow-2xl border-t border-[var(--text-secondary)]/15 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-4">
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)]">Google Map Type</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Choose basemap style for navigation</p>
            </div>
            <button
              onClick={() => setActiveSheet('none')}
              className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'roadmap' as const, label: 'Standard', desc: 'Google Roads' },
              { id: 'satellite' as const, label: 'Satellite', desc: 'Pure Imagery' },
              { id: 'hybrid' as const, label: 'Hybrid', desc: 'Satellite + Roads' },
              { id: 'terrain' as const, label: 'Terrain', desc: 'Topography' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => handleMapTypeChange(type.id)}
                className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer border ${
                  mapTypeId === type.id
                    ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/10 shadow-md'
                    : 'border-transparent bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80'
                }`}
              >
                <div className="w-10 h-10 rounded-xl mb-1.5 flex items-center justify-center font-black text-[11px] bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm">
                  {type.label.slice(0, 3).toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)]">{type.label}</span>
                {mapTypeId === type.id && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* B. Nearby Places Sheet */}
      {activeSheet === 'nearby' && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-t-3xl p-5 shadow-2xl border-t border-[var(--text-secondary)]/15 max-w-lg mx-auto max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-3">
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)]">Nearby Athletic Places</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Real Google Places API ({nearbyPlaces.length} found)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedNearbyCategories.length > 0 && (
                <button
                  onClick={() => setSelectedNearbyCategories([])}
                  className="text-xs text-[var(--accent-orange)] font-bold cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setActiveSheet('none')}
                className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {NEARBY_CATEGORIES.map(cat => {
              const isSelected = selectedNearbyCategories.includes(cat.category);
              const Icon = cat.icon;

              return (
                <button
                  key={cat.category}
                  onClick={() => {
                    setSelectedNearbyCategories(prev =>
                      isSelected ? prev.filter(c => c !== cat.category) : [...prev, cat.category]
                    );
                  }}
                  className={`p-2.5 rounded-xl flex items-center gap-2.5 text-left text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)] text-white shadow-sm'
                      : 'border-transparent bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/80'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2] shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Results count & status */}
          <div className="text-center py-2 text-xs text-[var(--text-secondary)]">
            {isLoadingNearby ? (
              <span className="flex items-center justify-center gap-1.5 text-[var(--accent-orange)] font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-ping" />
                Querying Google Places Platform...
              </span>
            ) : selectedNearbyCategories.length === 0 ? (
              <span>Select one or more categories above to display real Google Places on the map.</span>
            ) : nearbyPlaces.length === 0 ? (
              <span className="text-amber-400 font-semibold">No places found in current map area. Pan or zoom out to search further.</span>
            ) : (
              <span>Tap any pin on the map to view place details.</span>
            )}
          </div>
        </div>
      )}

      {/* C. Map Layers Sheet */}
      {activeSheet === 'layers' && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-t-3xl p-5 shadow-2xl border-t border-[var(--text-secondary)]/15 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-4">
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)]">Google Map Layers</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Live traffic and public transit overlays</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLayerTransit(false);
                  setLayerTraffic(false);
                }}
                className="text-xs text-[var(--accent-orange)] font-bold cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setActiveSheet('none')}
                className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Live Traffic Toggle */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)]">Live Traffic Conditions</span>
                <span className="text-[10px] text-[var(--text-secondary)] block">Real-time road congestion by Google Maps</span>
              </div>
              <button
                onClick={() => setLayerTraffic(!layerTraffic)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  layerTraffic ? 'bg-[var(--accent-orange)]' : 'bg-stone-700'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${layerTraffic ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            {/* Public Transit Toggle */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)]">Public Transit Lines</span>
                <span className="text-[10px] text-[var(--text-secondary)] block">Subway, train, and bus transit networks</span>
              </div>
              <button
                onClick={() => setLayerTransit(!layerTransit)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  layerTransit ? 'bg-[var(--accent-orange)]' : 'bg-stone-700'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${layerTransit ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. User Recorded Routes Filter Sheet */}
      {activeSheet === 'routes' && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-t-3xl p-5 shadow-2xl border-t border-[var(--text-secondary)]/15 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-4">
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)]">Recorded GPS Routes</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Overlay your sessions from HypeAtheDB</p>
            </div>
            <button
              onClick={() => setActiveSheet('none')}
              className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)] mb-4">
            <span className="text-xs font-bold text-[var(--text-primary)]">Show User Routes on Map</span>
            <button
              onClick={() => setShowUserRoutes(!showUserRoutes)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                showUserRoutes ? 'bg-[var(--accent-orange)]' : 'bg-stone-700'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showUserRoutes ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* Activity mode filter for routes */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Filter by Activity
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Running', 'Walking', 'Cycling', 'Biking', 'Sprinting', 'Hiking'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setUserRouteActivityFilter(mode)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRouteActivityFilter === mode
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Selected Place Information Bottom Card */}
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 z-40 bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-3xl p-5 shadow-2xl border border-[var(--text-secondary)]/15 max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)]">
                  {selectedPlace.category}
                </span>
                {selectedPlace.distanceMeters && (
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                    ~{(selectedPlace.distanceMeters / 1000).toFixed(1)} km away
                  </span>
                )}
                {selectedPlace.rating && (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 ml-1">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    <span>{selectedPlace.rating}</span>
                    {selectedPlace.userRatingsTotal && (
                      <span className="text-[var(--text-secondary)]">({selectedPlace.userRatingsTotal})</span>
                    )}
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-[var(--text-primary)]">{selectedPlace.name}</h4>
              {selectedPlace.address && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedPlace.address}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedPlace(null)}
              className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 border-t border-[var(--text-secondary)]/10 flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--accent-orange)] font-bold hover:underline"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
