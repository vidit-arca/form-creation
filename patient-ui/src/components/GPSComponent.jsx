import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

// Fix Leaflet default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks for manual pin dropping
function LocationMarker({ position, setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      if (onChange) onChange(newPos);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export function GPSComponent({ field, value, onChange }) {
  // Default center: India
  const defaultCenter = [20.5937, 78.9629];
  const [position, setPosition] = useState(value ? { lat: value.lat, lng: value.lng } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (value && value.lat && value.lng) {
      setPosition({ lat: value.lat, lng: value.lng });
    }
  }, [value]);

  const captureLocation = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation sensor is not supported by your browser environment.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPos);
        if (onChange) onChange(newPos);
        
        // Fly to the new location
        if (mapRef.current) {
          mapRef.current.flyTo([newPos.lat, newPos.lng], 15);
        }
        setLoading(false);
      },
      (err) => {
        setError(`Unable to acquire satellite lock: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            {field.label || 'GPS Telemetry Coordinates'} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <p className="text-xs text-slate-500 mt-0.5">Capture real-time terminal coordinates or click on the map viewport to pin.</p>
        </div>
        <button
          type="button"
          onClick={captureLocation}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition shadow-xs active:translate-y-[1px] ${
            loading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-teal-700 hover:bg-teal-800 text-white'
          }`}
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Acquiring...' : 'Capture GPS Coordinates'}</span>
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-800 text-xs font-mono rounded-lg border border-rose-200">{error}</div>}

      <div className="h-64 sm:h-72 w-full rounded-lg overflow-hidden border border-slate-300 relative z-0">
        <MapContainer 
          center={position ? [position.lat, position.lng] : defaultCenter} 
          zoom={position ? 15 : 5} 
          scrollWheelZoom={true}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
        </MapContainer>
      </div>
      
      {position && (
        <div className="flex items-center gap-4 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500">LAT: <strong className="text-slate-900">{position.lat.toFixed(6)}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">LNG: <strong className="text-slate-900">{position.lng.toFixed(6)}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-teal-700 font-semibold inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 text-teal-600" />
            <span>GEO_PIN_LOCKED</span>
          </span>
        </div>
      )}
    </div>
  );
}
