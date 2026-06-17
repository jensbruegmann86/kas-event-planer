export type Rolle = 'Admin' | 'Mitarbeiter' | 'Ansprechpartner' | 'Volunteer';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type EventRow = {
  id: string;
  name: string;
  datum: string;
};

export type UserRow = {
  id: string;
  vorname: string;
  name: string;
  strasse: string | null;
  hausnummer: string | null;
  mobil: string | null;
  mail: string;
  kleidergroesse_tshirt: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null;
  kleidergroesse_jacke: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null;
  schuhgroesse: number | null;
  rolle: Rolle;
};

export type GruppeRow = {
  id: string;
  event_id: string;
  gruppenname: string;
  ansprechpartner_id: string | null;
};

export type GruppenMitgliedRow = {
  gruppe_id: string;
  user_id: string;
};

export type StandortRow = {
  id: string;
  event_id: string;
  name: string;
  typ: string;
  latitude: number;
  longitude: number;
  pdf_anhang_url: string | null;
  bedarf_volunteers: number;
};

export type StandortZuweisungRow = {
  id: string;
  standort_id: string;
  gruppe_id: string | null;
  user_id: string | null;
  zugewiesen_am: string;
};
