// Auth Service - jetzt über Base44
// Diese Funktionen sind nur noch Wrapper/Stubs, da Base44 die Auth übernimmt

import { base44 } from '@/api/base44Client';

// Alle Auth-Funktionen werden jetzt über Base44 abgewickelt
// Diese Datei existiert nur noch für Kompatibilität

export async function signUp() {
  // Redirect zu Base44 Login
  base44.auth.redirectToLogin();
}

export async function signIn() {
  // Redirect zu Base44 Login
  base44.auth.redirectToLogin();
}

export async function sendMagicLink() {
  // Redirect zu Base44 Login
  base44.auth.redirectToLogin();
}

export async function signOut() {
  await base44.auth.logout();
}

export async function resetPassword() {
  // Redirect zu Base44 Login
  base44.auth.redirectToLogin();
}

export async function signInWithGoogle() {
  // Redirect zu Base44 Login
  base44.auth.redirectToLogin();
}

export async function verifyOtp() {
  // Nicht mehr benötigt - Base44 handled das
  return null;
}