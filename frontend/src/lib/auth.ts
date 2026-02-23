import { encrypt, decrypt } from "./crypto";

let _accessToken: string | null = null;

export const setToken = async (token: string) => {
  _accessToken = token;
  const encrypted = await encrypt(token)
  sessionStorage.setItem("access_token", encrypted);
};
export const getToken = async (): Promise<string | null> => {
  if (_accessToken) return _accessToken;
  const stored = sessionStorage.getItem("access_token");
  if (stored) {
    _accessToken = stored;
    const decrypted = await decrypt(stored)
    return decrypted;
  }
  return null;
};

export const clearToken = () => {
  _accessToken = null;
  sessionStorage.removeItem("access_token");
};
