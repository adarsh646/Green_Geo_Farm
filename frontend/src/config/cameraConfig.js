import { API_BASE_URL } from '../api/http';

const DEFAULT_CAMERA_BASE_URL = `${API_BASE_URL}/api/camera-stream`;

const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '');

const CAMERA_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_CAMERA_BASE_URL || DEFAULT_CAMERA_BASE_URL,
);

const getWsUrl = (baseUrl) => {
  if (import.meta.env.VITE_CAMERA_WS_URL) {
    return import.meta.env.VITE_CAMERA_WS_URL.trim();
  }
  // If baseUrl is relative, construct absolute ws URL using window.location
  if (baseUrl.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}${baseUrl}/ws`;
  }
  return `${baseUrl.replace(/^http/i, 'ws')}/ws`;
};

const CAMERA_WS_URL = getWsUrl(CAMERA_BASE_URL);

export const CAMERA_CONFIG = {
  BASE_URL: CAMERA_BASE_URL,
  WS_URL: CAMERA_WS_URL,
  WIDE_FEED: `${CAMERA_BASE_URL}/video_feed/wide`,
  ZOOM_FEED: `${CAMERA_BASE_URL}/video_feed/zoom`,
  PTZ_TARGET: `${CAMERA_BASE_URL}/ptz/target`,
};
