import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import styles from "./WeekPlannerMap.module.css";

import { gardensToGeoJson } from "../../utils/gardensToGeoJson.js";
import { calculateGardensCenterBounds } from "../../utils/calculateGardensCenterBounds.js";
import { useGardensContext } from "../../context/GardensContext.jsx";

const DEFAULT_BOUNDS = [
  [32.4, 34.7],   // north-west corner
  [32.0, 35.0],   // south-east corner
];

function WeekPlannerMap({ selectedGarden, onSelectGarden }) {
  const { gardens } = useGardensContext();
  const [gardensGeoJson, setGardensGeoJson] = useState(null);
  const [mapBounds, setMapBounds] = useState(DEFAULT_BOUNDS);
  const mapRef = useRef(null);

  useEffect(() => {
    if (gardens?.length) {
      setGardensGeoJson(gardensToGeoJson(gardens));
      const { bounds } = calculateGardensCenterBounds(gardens);
      setMapBounds(bounds);
    } else {
      setGardensGeoJson({ type: "FeatureCollection", features: [] });
      const { bounds } = calculateGardensCenterBounds([]);
      setMapBounds(bounds);
    }
  }, [gardens]);

  // Fit map to bounds when they change
  useEffect(() => {
    if (mapRef.current && mapBounds) {
      mapRef.current.fitBounds(mapBounds, { padding: [50, 50] });
    }
  }, [mapBounds]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        ref={mapRef}
        bounds={mapBounds}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Gardens points */}
        {gardensGeoJson?.features.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties;
          const isSelected = selectedGarden?.id === props.id;

          const gardenDotIcon = new L.DivIcon({
            className: styles.gardenMarker,
            html: `
              <div class="${styles.gardenDotWrapper}">
                <div class="${styles.gardenDot} ${
              isSelected ? styles.selected : ""
            }"></div>
              </div>
            `,
            iconSize: null,
            iconAnchor: [12, 12],
          });

          return (
            <Marker
              key={props.id}
              position={[lat, lng]}
              icon={gardenDotIcon}
              eventHandlers={{
                click: () => onSelectGarden(props),
              }}
            >
              <Popup minWidth={150} maxWidth={200} closeButton={false}>
                <div className={styles.popup}>
                  <div className={styles.popupTitle}>{props.name}</div>
                  <div className={styles.popupInfo}>
                    {props.lastVisit
                      ? `ביקור אחרון: ${formatDate(props.lastVisit)}`
                      : "אין ביקורים"}
                  </div>
                  <div className={styles.popupAction}>
                    {isSelected ? "✓ נבחר" : "לחץ כדי לבחור"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default WeekPlannerMap;
