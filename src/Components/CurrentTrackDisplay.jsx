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
const CurrentTrackDisplay = ({
  track,
  audioFeatures,
  onGetRecommendations,
  loading,
}) => {
  const getFeatureColor = (value) => {
    if (value >= 0.7) return "text-green-400";
    if (value >= 0.4) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        Currently Playing
      </h2>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {track.album.images[0] && (
          <img
            src={track.album.images[0].url}
            alt={track.album.name}
            className="w-32 h-32 rounded-lg shadow-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-2xl truncate">
            {track.name}
          </h3>
          <p className="text-gray-400 text-lg truncate">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
          <p className="text-gray-500 text-sm mt-1 truncate">
            {track.album.name}
          </p>

          {audioFeatures && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Energy</div>
                <div
                  className={`text-lg font-bold ${getFeatureColor(
                    audioFeatures.energy
                  )}`}
                >
                  {Math.round(audioFeatures.energy * 100)}%
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Danceability</div>
                <div
                  className={`text-lg font-bold ${getFeatureColor(
                    audioFeatures.danceability
                  )}`}
                >
                  {Math.round(audioFeatures.danceability * 100)}%
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Mood</div>
                <div
                  className={`text-lg font-bold ${getFeatureColor(
                    audioFeatures.valence
                  )}`}
                >
                  {Math.round(audioFeatures.valence * 100)}%
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Tempo</div>
                <div className="text-lg font-bold text-blue-400">
                  {Math.round(audioFeatures.tempo)} BPM
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Acoustic</div>
                <div
                  className={`text-lg font-bold ${getFeatureColor(
                    audioFeatures.acousticness
                  )}`}
                >
                  {Math.round(audioFeatures.acousticness * 100)}%
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">Key</div>
                <div className="text-lg font-bold text-purple-400">
                  {[
                    "C",
                    "C♯",
                    "D",
                    "D♯",
                    "E",
                    "F",
                    "F♯",
                    "G",
                    "G♯",
                    "A",
                    "A♯",
                    "B",
                  ][audioFeatures.key] || "?"}
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onGetRecommendations}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold whitespace-nowrap"
        >
          {loading ? "Analyzing..." : "Get Smart Recommendations"}
        </button>
      </div>
    </div>
  );
};

export default CurrentTrackDisplay;
