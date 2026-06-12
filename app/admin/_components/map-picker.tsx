'use client';

import dynamic from 'next/dynamic';

const DynamicPicker = dynamic(
  () => import('./map-picker-inner').then((mod) => mod.MapPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 ring-1 ring-slate-200">
        Karte wird geladen...
      </div>
    ),
  },
);

type Props = {
  latitude: number;
  longitude: number;
  onChange: (coords: { lat: number; lng: number }) => void;
};

export function MapPicker(props: Props) {
  return <DynamicPicker {...props} />;
}
