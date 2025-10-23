import React, { useState, useEffect } from "react";
import {
  Music,
  Play,
  Plus,
  Loader2,
  RefreshCw,
  List,
  LogOut,
  TrendingUp,
  Info,
} from "lucide-react";

// ============================================
// SPOTIFY AUTH HOOK
// ============================================
const useSpotifyAuth = (CLIENT_ID, REDIRECT_URI, SCOPES) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = sessionStorage.getItem("spotify_token");
    const tokenExpiry = sessionStorage.getItem("spotify_token_expiry");

    if (storedToken && tokenExpiry) {
      const now = Date.now();
      if (now < parseInt(tokenExpiry)) {
        setToken(storedToken);
        return;
      } else {
        sessionStorage.removeItem("spotify_token");
        sessionStorage.removeItem("spotify_token_expiry");
      }
    }

    const hash = window.location.hash;
    let tokenFromUrl = hash
      .substring(1)
      .split("&")
      .find((elem) => elem.startsWith("access_token"));

    if (tokenFromUrl) {
      const accessToken = tokenFromUrl.split("=")[1];
      const expiresIn = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("expires_in"));
      const expiresInSeconds = expiresIn
        ? parseInt(expiresIn.split("=")[1])
        : 3600;

      window.location.hash = "";

      const expiryTime = Date.now() + expiresInSeconds * 1000;
      sessionStorage.setItem("spotify_token", accessToken);
      sessionStorage.setItem("spotify_token_expiry", expiryTime.toString());

      setToken(accessToken);
    }
  }, []);

  const login = () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
  };

  const logout = () => {
    sessionStorage.removeItem("spotify_token");
    sessionStorage.removeItem("spotify_token_expiry");
    setToken("");
  };

  return { token, login, logout };
};

export default useSpotifyAuth;
