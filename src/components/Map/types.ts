import type { HTMLAttributes } from 'react';

export type LocationState = {
  latitude: number;
  longitude: number;
};

export type MapProps = HTMLAttributes<HTMLDivElement> & {
  draggable?: boolean;
  defaultZoom?: number;
  defaultLocation?: LocationState | (() => LocationState);
  onLocationChange?: (location: LocationState) => unknown;
};
