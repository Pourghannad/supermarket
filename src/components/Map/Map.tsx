import type { FunctionComponent } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { memo, useMemo, useRef } from "react";
import MapLibreMap, { Marker } from "react-map-gl/maplibre";
import pkg from "maplibre-gl";
const { setRTLTextPlugin } = pkg;

import "maplibre-gl/dist/maplibre-gl.css";

import type { MapProps } from "./types";

if (typeof window !== "undefined") {
  setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js",
    false,
  );
}

const Map: FunctionComponent<MapProps> = (props) => {
  const {
    className,
    defaultZoom,
    defaultLocation,
    onLocationChange,
    draggable = false,
    ...rest
  } = props;

  const initialLocation = useMemo(() => {
    const loc =
      typeof defaultLocation === "function"
        ? defaultLocation()
        : defaultLocation;
    return {
      latitude: loc?.latitude ?? 35.790815,
      longitude: loc?.longitude ?? 51.417717,
    };
  }, [defaultLocation]);

  const mapRef = useRef<MapRef | null>(null);

  return (
    <div {...rest}>
      <MapLibreMap
        ref={mapRef}
        reuseMaps
        initialViewState={{
          zoom: defaultZoom ?? 12,
          longitude: initialLocation.longitude,
          latitude: initialLocation.latitude,
        }}
        onMove={(evt) => {
          if (!draggable) return;
          const { longitude, latitude } = evt.viewState;
          onLocationChange?.({
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
          });
        }}
        canvasContextAttributes={{ antialias: true }}
        mapStyle="https://tile.snappmaps.ir/styles/snapp-style/style.json"
        style={{ height: "100vh" }}
      >
        {!draggable ? (
          <Marker
            longitude={initialLocation.longitude}
            latitude={initialLocation.latitude}
            anchor="bottom"
          >
            <img src="/pictures/pin.png" alt="" />
          </Marker>
        ) : null}
      </MapLibreMap>

      {draggable ? <img src="/pictures/pin.png" alt="" /> : null}
    </div>
  );
};

export default memo(Map);
