import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// URL을 클렌징하고 검증하는 함수
const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  let clean = url.trim();
  // 슬래시 및 서픽스 제거
  clean = clean.replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v1$/, '');
  clean = clean.replace(/\/auth\/v1$/, '');
  return clean;
};

let supabaseUrl = sanitizeUrl(rawUrl);

const isValidUrl = (url: string): boolean => {
  return Boolean(url) && (url.startsWith('http://') || url.startsWith('https://'));
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
  console.warn(
    'Supabase URL or Anon Key is missing, invalid, or using placeholder values in .env.local. ' +
    'The app will continue in Local Guest Mode.'
  );
  // Fallback to safe placeholders to prevent initialization crash
  supabaseUrl = 'https://placeholder-url.supabase.co';
  supabaseAnonKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
