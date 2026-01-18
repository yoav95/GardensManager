import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import styles from "./AreasMap.module.css"; // reuse the same styles

import { areasGeoJson } from "../../data/areasGeoJson.js";
import { gardensToGeoJson } from "../../utils/gardensToGeoJson.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../hooks/useAuth.js";

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
  const { user } = useAuth();
  const [gardensGeoJson, setGardensGeoJson] = useState(null);

  async function fetchGardens() {
    if (!user) return [];
    const q = query(collection(db, "gardens"), where("userId", "==", user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  useEffect(() => {
    if (!user) {
      setGardensGeoJson({ type: "FeatureCollection", features: [] });
      return;
    }

    fetchGardens().then(gardens => {
      if (gardens?.length) {
        setGardensGeoJson(gardensToGeoJson(gardens));
      } else {
        setGardensGeoJson({ type: "FeatureCollection", features: [] });
      }
    });
  }, [user]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  

  return (
    <MapContainer
  bounds={israelCenterBounds}
  style={{ height: "70vh", width: "100%" }}
  scrollWheelZoom={false}
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
    e.target.setStyle({
      fillOpacity: 0.6, // make it darker on hover
      weight: 3,
    });
  },
    mouseout: (e) => {
    e.target.setStyle({
      fillOpacity: 0.35, // back to normal
      weight: 2,
    });
  },click: (e) => {
    e.target.setStyle({
      fillOpacity: 0.8,       // darker on click
      weight: 3,
      color: "#333",          // optional: change border color
    });
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
    </MapContainer>
  );
}
