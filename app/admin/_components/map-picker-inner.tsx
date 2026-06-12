'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

type Props = {
  latitude: number;
  longitude: number;
  onChange: (coords: { lat: number; lng: number }) => void;
};

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export function MapPickerInner({ latitude, longitude, onChange }: Props) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      className="h-64 w-full rounded-xl ring-1 ring-slate-200"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
      <ClickHandler onChange={onChange} />
    </MapContainer>
  );
}
