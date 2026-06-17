import axios from 'axios';
import { getManagementToken, getShopToken } from '../utils/sessionStorage';

const DEFAULT_TIMEOUT_MS = 20000;

const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '');
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '');

const joinUrl = (baseUrl, path) => {
  if (!path) return baseUrl;
  if (isAbsoluteUrl(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const resolveDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In local dev, Vite usually runs on a different port than the backend.
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }

  // In production, default to same-origin (/api...) and let reverse proxy handle routing.
  return '';
};

export const API_BASE_URL = normalizeBaseUrl(resolveDefaultApiBaseUrl());

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

export const buildApiUrl = (path) => joinUrl(API_BASE_URL, path);

const resolveDefaultCowHealthBaseUrl = () => {
  if (import.meta.env.VITE_COW_HEALTH_API_BASE_URL) {
    return import.meta.env.VITE_COW_HEALTH_API_BASE_URL;
  }

  if (API_BASE_URL) {
    return API_BASE_URL;
  }

  return import.meta.env.DEV ? 'http://localhost:5000' : '';
};

export const COW_HEALTH_API_BASE_URL = normalizeBaseUrl(resolveDefaultCowHealthBaseUrl());
export const COW_HEALTH_WS_URL = (import.meta.env.VITE_COW_HEALTH_WS_URL || '').trim();

export const buildCowHealthApiUrl = (path) => joinUrl(COW_HEALTH_API_BASE_URL, path);

const rewriteLegacyLocalUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  if (/^https?:\/\/(localhost|127\.0\.0\.1):(5000|5001)\b/i.test(url)) {
    return `${API_BASE_URL}${url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):(5000|5001)/i, '')}`;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000\b/i.test(url)) {
    return `${COW_HEALTH_API_BASE_URL}${url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/i, '')}`;
  }

  return url;
};

const shouldAttachAuthToken = (url) => {
  if (!url) return true;

  if (!isAbsoluteUrl(url)) {
    return url.startsWith('/api') || url.startsWith('api/');
  }

  if (!API_BASE_URL || !isAbsoluteUrl(API_BASE_URL)) {
    return false;
  }

  return url.startsWith(API_BASE_URL);
};

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = API_TIMEOUT_MS;
axios.defaults.headers.common.Accept = 'application/json';

axios.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.url = rewriteLegacyLocalUrl(config.url);

  const token = getManagementToken() || getShopToken();
  if (token && shouldAttachAuthToken(nextConfig.url) && !nextConfig.headers?.Authorization) {
    nextConfig.headers = {
      ...(nextConfig.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return nextConfig;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please retry.';
    }
    return Promise.reject(error);
  },
);
