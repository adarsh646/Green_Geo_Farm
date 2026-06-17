export const SESSION_KEYS = {
  SHOP_TOKEN: 'shopToken',
  SHOP_USERNAME: 'shopUsername',
  SHOP_EMAIL: 'shopEmail',
  SHOP_ROLE: 'shopRole',
  MANAGEMENT_TOKEN: 'managementToken',
  MANAGEMENT_USERNAME: 'managementUsername',
  MANAGEMENT_EMAIL: 'managementEmail',
  MANAGEMENT_ROLE: 'managementRole',
  LEGACY_TOKEN: 'token',
  LEGACY_USERNAME: 'username',
  LEGACY_ROLE: 'role',
};

const AUTH_CHANGE_EVENT = 'geofarm:auth-change';

const emitAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

export const setShopSession = ({ token, username, email, role }) => {
  localStorage.setItem(SESSION_KEYS.SHOP_TOKEN, token);
  localStorage.setItem(SESSION_KEYS.SHOP_USERNAME, username);
  localStorage.setItem(SESSION_KEYS.SHOP_EMAIL, email || '');
  localStorage.setItem(SESSION_KEYS.SHOP_ROLE, role);
  emitAuthChange();
};

export const setManagementSession = ({ token, username, email, role }) => {
  localStorage.setItem(SESSION_KEYS.MANAGEMENT_TOKEN, token);
  localStorage.setItem(SESSION_KEYS.MANAGEMENT_USERNAME, username);
  localStorage.setItem(SESSION_KEYS.MANAGEMENT_EMAIL, email || '');
  localStorage.setItem(SESSION_KEYS.MANAGEMENT_ROLE, role);
  emitAuthChange();
};

export const clearShopSession = () => {
  localStorage.removeItem(SESSION_KEYS.SHOP_TOKEN);
  localStorage.removeItem(SESSION_KEYS.SHOP_USERNAME);
  localStorage.removeItem(SESSION_KEYS.SHOP_EMAIL);
  localStorage.removeItem(SESSION_KEYS.SHOP_ROLE);
  emitAuthChange();
};

export const clearManagementSession = () => {
  localStorage.removeItem(SESSION_KEYS.MANAGEMENT_TOKEN);
  localStorage.removeItem(SESSION_KEYS.MANAGEMENT_USERNAME);
  localStorage.removeItem(SESSION_KEYS.MANAGEMENT_EMAIL);
  localStorage.removeItem(SESSION_KEYS.MANAGEMENT_ROLE);
  emitAuthChange();
};

export const clearLegacySession = () => {
  localStorage.removeItem(SESSION_KEYS.LEGACY_TOKEN);
  localStorage.removeItem(SESSION_KEYS.LEGACY_USERNAME);
  localStorage.removeItem(SESSION_KEYS.LEGACY_ROLE);
  emitAuthChange();
};

export const clearAllSessions = () => {
  clearShopSession();
  clearManagementSession();
  clearLegacySession();
};

export const getShopToken = () => localStorage.getItem(SESSION_KEYS.SHOP_TOKEN);
export const getShopUsername = () => localStorage.getItem(SESSION_KEYS.SHOP_USERNAME);
export const getShopEmail = () => localStorage.getItem(SESSION_KEYS.SHOP_EMAIL);
export const getShopRole = () => localStorage.getItem(SESSION_KEYS.SHOP_ROLE);
export const getManagementToken = () => localStorage.getItem(SESSION_KEYS.MANAGEMENT_TOKEN);
export const getManagementUsername = () => localStorage.getItem(SESSION_KEYS.MANAGEMENT_USERNAME);
export const getManagementEmail = () => localStorage.getItem(SESSION_KEYS.MANAGEMENT_EMAIL);
export const getManagementRole = () => localStorage.getItem(SESSION_KEYS.MANAGEMENT_ROLE);
