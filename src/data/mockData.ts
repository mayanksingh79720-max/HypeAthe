import { RouteItem, RunningLocation } from '../types';

export const initialRoutes: RouteItem[] = [
  {
    id: 'route-1',
    name: 'Riverside Loop',
    location: 'Central Waterfront Park',
    distanceKm: 8.4,
    elevationGainM: 45,
    difficulty: 'Moderate',
    rating: 4.8,
    reviewsCount: 124,
    category: 'Popular',
    bookmarked: false
  },
  {
    id: 'route-2',
    name: 'Summit Hill Climb',
    location: 'Highland Overlook',
    distanceKm: 5.2,
    elevationGainM: 210,
    difficulty: 'Challenging',
    rating: 4.9,
    reviewsCount: 88,
    category: 'Hill Runs',
    bookmarked: true
  },
  {
    id: 'route-3',
    name: 'Downtown 5K Sprint',
    location: 'Metro Center Promenade',
    distanceKm: 5.0,
    elevationGainM: 15,
    difficulty: 'Easy',
    rating: 4.6,
    reviewsCount: 215,
    category: '5K',
    bookmarked: false
  },
  {
    id: 'route-4',
    name: 'Oceanview Coastway',
    location: 'Pacific Coastal Highway',
    distanceKm: 14.5,
    elevationGainM: 80,
    difficulty: 'Moderate',
    rating: 4.7,
    reviewsCount: 96,
    category: 'Popular',
    bookmarked: false
  },
  {
    id: 'route-5',
    name: 'Pinecrest Forest Trail',
    location: 'Northern Woods Reserve',
    distanceKm: 11.2,
    elevationGainM: 190,
    difficulty: 'Challenging',
    rating: 4.9,
    reviewsCount: 75,
    category: 'Trail',
    bookmarked: false
  }
];

export const runningLocations: RunningLocation[] = [
  {
    id: 'loc-1',
    name: 'Central Park',
    routesCount: 12,
    city: 'Metro Hub',
    popularType: 'Urban Paved Loops'
  },
  {
    id: 'loc-2',
    name: 'City Trail',
    routesCount: 9,
    city: 'Downtown Corridor',
    popularType: 'Riverwalk & Bridges'
  },
  {
    id: 'loc-3',
    name: 'Coastal Highway',
    routesCount: 15,
    city: 'Ocean Promenade',
    popularType: 'Flat Ocean Views'
  },
  {
    id: 'loc-4',
    name: 'Alpine Ridge',
    routesCount: 7,
    city: 'Mountain Park',
    popularType: 'Technical Singletrack'
  }
];
