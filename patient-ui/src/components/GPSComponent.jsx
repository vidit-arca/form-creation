import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
      setError('Geolocation is not supported by your browser.');
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
        setError(`Unable to retrieve location: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-sm font-bold text-gray-700 block">
            {field.label || 'GPS Location'} {field.required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-xs text-gray-500 mt-1">Capture your current location or click on the map to drop a pin.</p>
        </div>
        <button
          type="button"
          onClick={captureLocation}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${
            loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
          {loading ? 'Locating...' : 'Capture Location'}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

      <div className="h-64 sm:h-80 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
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
        <div className="flex gap-4 text-xs font-mono bg-gray-50 p-2 rounded border border-gray-200">
          <span className="text-gray-600">Lat: <strong className="text-gray-900">{position.lat.toFixed(6)}</strong></span>
          <span className="text-gray-600">Lng: <strong className="text-gray-900">{position.lng.toFixed(6)}</strong></span>
        </div>
      )}
    </div>
  );
}
