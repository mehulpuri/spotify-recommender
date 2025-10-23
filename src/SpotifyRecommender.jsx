import React, { useState, useEffect, useRef } from "react";

import {
  Music,
  Play,
  Plus,
  Loader2,
  RefreshCw,
  List,
  LogOut,
  TrendingUp,
} from "lucide-react";

import useSpotifyAuth from "./Components/useSpotifyAuth";
import PlaylistSidebar from "./Components/PlaylistSidebar";
import CurrentTrackDisplay from "./Components/CurrentTrackDisplay";
import RecommendationCard from "./Components/RecommendationCard";
import { calculateSmartMatch } from "./Util/calculateSmartMatch";

const SpotifyRecommender = () => {
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = window.location.origin;
  const RECCOBEATS_API = "https://api.reccobeats.com/v1";

  const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
  ].join(" ");

  const { token, login, logout } = useSpotifyAuth(
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES
  );

  const [playlists, setPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const pollingInterval = useRef(null);

  useEffect(() => {
    if (token) {
      fetchPlaylists();
      fetchDevices();
      fetchCurrentTrack();

      pollingInterval.current = setInterval(() => {
        fetchCurrentTrack();
      }, 3000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [token]);

  const fetchSpotify = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      setError("Session expired. Please login again.");
      logout();
      return null;
    }

    if (response.status === 204) return null;
    if (!response.ok) return null;

    return response.json();
  };

  const fetchPlaylists = async () => {
    const data = await fetchSpotify(
      "https://api.spotify.com/v1/me/playlists?limit=50"
    );
    if (data) setPlaylists(data.items);
  };

  const fetchDevices = async () => {
    const data = await fetchSpotify(
      "https://api.spotify.com/v1/me/player/devices"
    );
    if (data) {
      setDevices(data.devices);
      const active = data.devices.find((d) => d.is_active);
      if (active) setActiveDevice(active.id);
    }
  };

  const fetchCurrentTrack = async () => {
    const data = await fetchSpotify(
      "https://api.spotify.com/v1/me/player/currently-playing"
    );
    if (data && data.item) {
      setCurrentTrack(data.item);
    } else if (data === null) {
      setCurrentTrack(null);
    }
  };

  const getRecommendations = async () => {
    if (!currentTrack) return;

    setLoading(true);
    setError("");

    try {
      // Get audio features for current track
      const featuresResponse = await fetch(
        `${RECCOBEATS_API}/audio-features?ids=${currentTrack.id}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (!featuresResponse.ok) throw new Error("Failed to get audio features");

      const featuresData = await featuresResponse.json();
      if (!featuresData.content || featuresData.content.length === 0) {
        throw new Error("No audio features found");
      }

      const features = featuresData.content[0];
      setAudioFeatures(features);

      // Get artist IDs as additional seeds
      const artistIds = currentTrack.artists.slice(0, 2).map((a) => a.id);

      // Build smart recommendation query
      const params = new URLSearchParams({
        seeds: currentTrack.id,
        size: "30",
        energy: features.energy.toString(),
        danceability: features.danceability.toString(),
        valence: features.valence.toString(),
        tempo: features.tempo.toString(),
        acousticness: features.acousticness.toString(),
        instrumentalness: features.instrumentalness.toString(),
        key: features.key.toString(),
        mode: features.mode.toString(),
        speechiness: features.speechiness.toString(),
        featureWeight: "1.0", // Higher weight for closer matches
      });

      const recResponse = await fetch(
        `${RECCOBEATS_API}/track/recommendation?${params}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (!recResponse.ok) throw new Error("Failed to get recommendations");

      const recData = await recResponse.json();

      if (recData && recData.content && recData.content.length > 0) {
        const spotifyIds = recData.content
          .map((track) => {
            const match = track.href.match(/track\/([a-zA-Z0-9]+)/);
            return match ? match[1] : null;
          })
          .filter((id) => id !== null && id !== currentTrack.id) // Exclude current track
          .slice(0, 20);

        if (spotifyIds.length === 0)
          throw new Error("No valid recommendations");

        // Batch fetch Spotify details
        const spotifyTracksResponse = await fetchSpotify(
          `https://api.spotify.com/v1/tracks?ids=${spotifyIds.join(",")}`
        );

        if (!spotifyTracksResponse?.tracks)
          throw new Error("Failed to fetch track details");

        // Batch fetch audio features
        const recFeaturesResponse = await fetch(
          `${RECCOBEATS_API}/audio-features?${spotifyIds
            .map((id) => `ids=${id}`)
            .join("&")}`,
          { headers: { Accept: "application/json" } }
        );

        let recFeaturesMap = new Map();
        if (recFeaturesResponse.ok) {
          const recFeaturesData = await recFeaturesResponse.json();
          if (recFeaturesData.content) {
            recFeaturesData.content.forEach((feat) => {
              const match = feat.href.match(/track\/([a-zA-Z0-9]+)/);
              if (match) recFeaturesMap.set(match[1], feat);
            });
          }
        }

        // Calculate smart match scores
        const tracksWithScores = spotifyTracksResponse.tracks
          .filter((t) => t !== null)
          .map((spotifyTrack) => {
            const recFeatures = recFeaturesMap.get(spotifyTrack.id);
            const score = calculateSmartMatch(
              features,
              recFeatures,
              currentTrack,
              spotifyTrack
            );

            return { ...spotifyTrack, matchScore: score };
          })
          .filter((t) => t.matchScore >= 40); // Only show decent matches

        tracksWithScores.sort((a, b) => b.matchScore - a.matchScore);
        setRecommendations(tracksWithScores);

        if (tracksWithScores.length === 0) {
          setError("No good matches found. Try a different song!");
        }
      }
    } catch (err) {
      setError("Failed to get recommendations: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (uri) => {
    const deviceId = activeDevice || devices[0]?.id;
    if (!deviceId) {
      setError("No active device. Please open Spotify on a device.");
      return;
    }

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [uri] }),
        }
      );
      setTimeout(fetchCurrentTrack, 1000);
    } catch (err) {
      setError("Failed to play track");
    }
  };

  const addToQueue = async (uri) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/queue?uri=${uri}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setError("✓ Added to queue!");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      setError("Failed to add to queue");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-12 max-w-md w-full text-center shadow-2xl">
          <Music className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-3">
            Spotify Recommender
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            AI-powered smart music recommendations
          </p>
          <button
            onClick={login}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 text-lg"
          >
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #059669; }
      `}</style>

      <div className="w-full mx-auto">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Music className="w-8 h-8" />
                  Smart Recommender
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  Intelligent song recommendations
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div
              className={`${
                error.startsWith("✓") ? "bg-green-500" : "bg-red-500"
              } text-white p-4 m-4 rounded-lg flex items-center gap-2`}
            >
              {error.startsWith("✓") ? "✓" : <Info className="w-5 h-5" />}
              {error}
            </div>
          )}

          <div className="p-4 grid lg:grid-cols-4 gap-4">
            <PlaylistSidebar
              playlists={playlists}
              onSelectPlaylist={(id) => {
                /* Could analyze playlist in future */
              }}
              onRefresh={fetchPlaylists}
            />

            <div className="lg:col-span-3 space-y-4">
              {currentTrack ? (
                <CurrentTrackDisplay
                  track={currentTrack}
                  audioFeatures={audioFeatures}
                  onGetRecommendations={getRecommendations}
                  loading={loading}
                />
              ) : (
                <div className="bg-gray-800 rounded-xl p-16 text-center">
                  <Music className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl text-white font-semibold mb-2">
                    No Song Playing
                  </h3>
                  <p className="text-gray-400">
                    Start playing a song on Spotify to get intelligent
                    recommendations
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-gray-800 rounded-xl p-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                  <p className="text-gray-400 text-center">
                    Analyzing with AI...
                    <br />
                    <span className="text-sm">
                      Matching tempo, energy, mood, and more
                    </span>
                  </p>
                </div>
              )}

              {recommendations.length > 0 && !loading && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Smart Recommendations ({recommendations.length} tracks)
                  </h2>
                  <div className="space-y-3">
                    {recommendations.map((track) => (
                      <RecommendationCard
                        key={track.id}
                        track={track}
                        onPlay={playTrack}
                        onQueue={addToQueue}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyRecommender;
