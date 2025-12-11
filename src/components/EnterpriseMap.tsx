import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
// High-Risk industrial zones (Simulated GeoJSON)
const HIGH_RISK_ZONES = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Zone Alpha (Risk High)", severity: 0.8 }, geometry: { type: "Polygon", coordinates: [[[18.4, -33.9], [18.5, -33.9], [18.5, -34.0], [18.4, -34.0], [18.4, -33.9]]] } }
  ]
};
interface EnterpriseMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
}
export function EnterpriseMap({ className, center = [-33.9249, 18.4241], zoom = 12 }: EnterpriseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    // Fix default marker icons in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
    const map = L.map(mapRef.current).setView(center, zoom);
    // Industrial Dark Theme (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO',
      maxZoom: 19
    }).addTo(map);
    // Add Risk Zones Overlay
    L.geoJSON(HIGH_RISK_ZONES as any, {
      style: { color: "#ef4444", weight: 2, opacity: 0.6, fillColor: "#ef4444", fillOpacity: 0.1 }
    }).addTo(map).bindPopup("CRITICAL: HIGH-RISK CRIME ZONE");
    leafletRef.current = map;
    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, [center, zoom]);
  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-white/5 shadow-elevation-3", className)}>
      <div ref={mapRef} className="h-full w-full z-0" />
      <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Geospatial Engine Live
      </div>
      <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest space-y-1">
        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Collection Nodes</div>
        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" /> High-Risk Polygons</div>
      </div>
    </div>
  );
}