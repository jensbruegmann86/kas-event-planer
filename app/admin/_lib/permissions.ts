import type { GruppeRow, Rolle } from './types';

export function canManageStandorte(role: Rolle | null): boolean {
  return role === 'Admin' || role === 'Mitarbeiter';
}

export function canManageGruppen(role: Rolle | null): boolean {
  return role === 'Admin' || role === 'Mitarbeiter';
}

export function canManageMitglieder(
  role: Rolle | null,
  group: GruppeRow,
  currentUserId: string | null,
): boolean {
  if (role === 'Admin' || role === 'Mitarbeiter') return true;
  if (role === 'Ansprechpartner' && currentUserId && group.ansprechpartner_id === currentUserId) {
    return true;
  }
  return false;
}
