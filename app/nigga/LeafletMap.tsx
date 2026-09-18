"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

export default function LeafletMap() {
  return (
    <MapContainer
      center={[24.7961, 120.9967]}
      zoom={15}
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CircleMarker
        center={[24.7961, 120.9967]}
        radius={10}
      >
        <Popup>
          我的第一個地點
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}