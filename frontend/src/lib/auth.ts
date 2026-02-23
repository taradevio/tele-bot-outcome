let _accessToken: string | null = null;

export const setToken = (token: string) => {
  _accessToken = token;
  sessionStorage.setItem("access_token", token);
};
export const getToken = (): string | null => {
  if (_accessToken) return _accessToken;
  const stored = sessionStorage.getItem("access_token");
  if (stored) {
    _accessToken = stored;
    return stored;
  }
  return null;
};

export const clearToken = () => {
  _accessToken = null;
  sessionStorage.removeItem("access_token");
};
