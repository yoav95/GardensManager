import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import styles from "./AreasMap.module.css";

import { areasGeoJson } from "../../data/areasGeoJson.js";
import { gardensToGeoJson } from "../../utils/gardensToGeoJson.js";
import { useGardensContext } from "../../context/GardensContext.jsx";

const israelCenterBounds = [
  [32.4, 34.7], // north-west corner (Netanya area)
  [32.0, 35.0], // south-east corner (Tel Aviv / Petah Tikva)
];
const areaColors = {
  A: "#1e90ff",
  B: "#ff9f1c",
  C: "#ffd93d",
  D: "#6a4c93",
  E: "#1e90ff",
  F: "#ff9f1c",
  G: "#2ec4b6",
  H: "#e71d36",
};

const wasteDaysByArea = {
  A: "שני, רביעי",
  B: "ראשון, שלישי",
  C: "שלישי",
  D: "רביעי",
  E: "חמישי",
  F: "שישי",
  G: "שבת",
  H: "ראשון",
};
function formatFirestoreDate(ts) {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
}


function getPolygonCenter(layer) {
  // L.Polygon provides getBounds(), we can use getCenter()
  return layer.getBounds().getCenter();
}

export default function AreasMap() {
  const { gardens } = useGardensContext();
  const [gardensGeoJson, setGardensGeoJson] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const lastClickedLayerRef = useRef(null);

  useEffect(() => {
    if (gardens?.length) {
      setGardensGeoJson(gardensToGeoJson(gardens));
    } else {
      setGardensGeoJson({ type: "FeatureCollection", features: [] });
    }
  }, [gardens]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  const toggleFullscreen = () => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleGetUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("GPS לא זמין בדפדפן זה");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy
        });
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = "שגיאה בקבלת המיקום";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "אנא הרשה גישה ל-GPS";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "GPS לא זמין כרגע";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "זמן המתנה לGPS חלף";
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={mapContainerRef} className={styles.mapWrapper}>
      {/* Fullscreen button */}
      <button 
        className={styles.fullscreenButton}
        onClick={toggleFullscreen}
        title={isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}
      >
        {isFullscreen ? "✕" : "⛶"}
      </button>

      {/* GPS Location button */}
      <button 
        className={styles.gpsButton}
        onClick={handleGetUserLocation}
        disabled={locationLoading}
        title={locationLoading ? "טוען..." : "גישור ממיקומי"}
      >
        {locationLoading ? "⟳" : "⌖"}
      </button>

      {/* Location error message */}
      {locationError && (
        <div className={styles.locationError}>
          {locationError}
        </div>
      )}

      <MapContainer
        ref={mapRef}
        bounds={israelCenterBounds}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Areas polygons */}
      <GeoJSON
        data={areasGeoJson}
        style={(feature) => ({
  color: areaColors[feature.properties.area],
  fillColor: areaColors[feature.properties.area],
  fillOpacity: 0.35,
  weight: 2,
})}
 onEachFeature={(feature, layer) => {
  const area = feature.properties.area;
  const wasteDays = wasteDaysByArea[area] ?? "לא ידוע";
  const baseColor = areaColors[area]; // keep the color reference

  layer.bindTooltip(
    `אזור ${area} – ימי פינוי: ${wasteDays}`,
    {
      sticky: true,
      direction: "top",
      className: "areaTooltip",
    }
  );

  layer.on({
  mouseover: (e) => {
    // Don't change style if this is the currently selected layer
    if (lastClickedLayerRef.current !== e.target) {
      e.target.setStyle({
        fillOpacity: 0.6, // make it darker on hover
        weight: 3,
      });
    }
  },
    mouseout: (e) => {
    // Don't change style if this is the currently selected layer
    if (lastClickedLayerRef.current !== e.target) {
      e.target.setStyle({
        fillOpacity: 0.35, // back to normal
        weight: 2,
      });
    }
  },click: (e) => {
    // Reset previous clicked layer if it exists
    if (lastClickedLayerRef.current) {
      lastClickedLayerRef.current.setStyle({
        fillOpacity: 0.35,
        weight: 2,
        color: areaColors[lastClickedLayerRef.current.feature.properties.area],
      });
    }
    
    // Highlight the clicked layer with nice styling
    e.target.setStyle({
      fillOpacity: 0.75,
      weight: 5,
      color: "#FFD700",  // Gold border
      dashArray: "10, 5",  // Dashed border
    });
    
    // Store reference to this layer
    lastClickedLayerRef.current = e.target;
  },
  });
}}
      />

      {/* Gardens points */}
      {gardensGeoJson?.features.map(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        
        
 const dayClass = props.day
    ? styles[`day${props.day.charAt(0).toUpperCase() + props.day.slice(1)}`]
    : "";

    const unresolvedIssues = Array.isArray(props.requiresAttention)
  ? props.requiresAttention.filter(issue => !issue.resolved)
  : [];

    const hasUnresolvedIssues = unresolvedIssues.length > 0;





const gardenDotIcon = new L.DivIcon({
  className: styles.gardenMarker,
  html: `
    <div class="${styles.gardenDotWrapper}">
      <div class="${styles.gardenDot} ${dayClass} ${
        hasUnresolvedIssues ? styles.hasIssue : ""
      }"></div>
      ${
        hasUnresolvedIssues
          ? `<div class="${styles.issueBadge}">!</div>`
          : ""
      }
    </div>

    <div class="${styles.gardenLabel}">
      <div class="${styles.gardenTitle}">${props.name}</div>
      <div class="${styles.gardenLastVisit}">
        ${props.lastVisit ? formatDate(props.lastVisit) : "אין ביקורים"}
      </div>
    </div>
  `,
  iconSize: null,
  iconAnchor: [14, 14],
});

        return (
          <Marker key={props.id} position={[lat, lng]} icon={gardenDotIcon}>
  <Popup minWidth={180} maxWidth={260} closeButton={false}>
  <div
    className={styles.popup}
    role="button"
    onClick={() => {
      window.location.href = `/garden/${props.id}`;
    }}
  >
    {props.imageURL && (
      <img
        src={props.imageURL}
        className={styles.popupImage}
        alt={props.name}
      />
    )}

    <div className={styles.popupContent}>
      <div className={styles.popupTitle}>{props.name}</div>
      <div className={styles.popupAddress}>{props.address}</div>

      {/* 🔥 ISSUES – ONLY IF EXIST */}
      {hasUnresolvedIssues && (
        <div className={styles.popupIssues}>
          <div className={styles.popupIssuesTitle}>
            ⚠️ בעיות פתוחות
          </div>

          <ul className={styles.popupIssuesList}>
            {unresolvedIssues.map((issue, idx) => (
              <li key={idx} className={styles.popupIssueItem}>
                <span className={styles.popupIssueText}>
                  {issue.text}
                </span>
                {issue.createdAt && (
                  <span className={styles.popupIssueDate}>
                    {formatFirestoreDate(issue.createdAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.popupFooter}>
        <span className={styles.popupDate}>
          {props.lastVisit ? formatDate(props.lastVisit) : "אין ביקורים"}
        </span>

        <button
          className={styles.popupNav}
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `https://waze.com/ul?q=${props.locationURL ?? ""}`,
              "_blank"
            );
          }}
        >
          ניווט
        </button>
      </div>
    </div>
  </div>
</Popup>



</Marker>

        );
      })}

      {/* User Location Marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={L.icon({
            iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='8' fill='%233b82f6'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%2360a5fa'/%3E%3Ccircle cx='16' cy='16' r='3' fill='white'/%3E%3Ccircle cx='16' cy='16' r='14' fill='none' stroke='%233b82f6' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          })}
        >
          <Popup>
            <div className={styles.userLocationPopup}>
              <div className={styles.userLocationTitle}>📍 המיקום שלך</div>
              <div>קו רוחב: {userLocation.lat.toFixed(6)}</div>
              <div>קו אורך: {userLocation.lng.toFixed(6)}</div>
              {userLocation.accuracy && (
                <div>דיוק: ±{Math.round(userLocation.accuracy)} מטרים</div>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
    </div>
  );
}
