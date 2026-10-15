import { createContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { setAccessToken } from "../lib/tokenStore";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" -> silently trying the refresh cookie on first load
  const [status, setStatus] = useState("checking"); // checking | authenticated | guest

  // On app mount: we don't know yet if the user has a valid session, because
  // the access token lives only in memory and just got wiped by the page load.
  // The httpOnly refresh cookie, though, survives — so we try it silently.
  useEffect(() => {
    (async () => {
      try {
        const data = await authApi.refresh();
        setAccessToken(data.accessToken);
        setUser(data.user);
        setStatus("authenticated");
        connectSocket(data.accessToken);
      } catch {
        setStatus("guest");
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus("authenticated");
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await authApi.signup(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus("authenticated");
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // even if the server call fails, clear local state so the UI doesn't get stuck
    }
    setAccessToken(null);
    setUser(null);
    setStatus("guest");
    disconnectSocket();
    toast.success("Logged out");
  }, []);

  const value = { user, status, isAuthenticated: status === "authenticated", login, signup, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
