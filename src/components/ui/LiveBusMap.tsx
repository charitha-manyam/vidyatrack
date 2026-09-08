import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
};

// Same stack as the web parent portal's TrackingPage: Leaflet + free
// OpenStreetMap tiles, no Google Maps API key needed. Works in Expo Go too.
function leafletHtml(latitude: number, longitude: number, title?: string, description?: string) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const popup = `<b>${esc(title ?? "")}</b>${description ? `<br/>${esc(description)}` : ""}`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { scrollWheelZoom: false, zoomControl: false }).setView([${latitude}, ${longitude}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    var marker = L.marker([${latitude}, ${longitude}]).addTo(map);
    marker.bindPopup('${popup}');
  </script>
</body>
</html>`;
}

export function LiveBusMap({ latitude, longitude, title, description, style }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.fallback, style]}>
        <Feather name="map-pin" size={18} color="#6b7280" />
        <Text style={styles.fallbackText}>Live map unavailable on this build</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <WebView
        style={styles.webview}
        source={{ html: leafletHtml(latitude, longitude, title, description) }}
        originWhitelist={["*"]}
        javaScriptEnabled
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f4f7f6",
    borderRadius: 8,
  },
  fallbackText: {
    fontSize: 12,
    color: "#6b7280",
  },
});