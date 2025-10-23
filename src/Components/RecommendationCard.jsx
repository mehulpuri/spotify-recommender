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
const RecommendationCard = ({ track, onPlay, onQueue }) => {
  const getMatchColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Good Match";
    if (score >= 55) return "Fair Match";
    return "Different Vibe";
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all hover:scale-[1.01]">
      <div className="flex items-center gap-4">
        {track.album.images[0] && (
          <img
            src={track.album.images[0].url}
            alt={track.album.name}
            className="w-20 h-20 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">
            {track.name}
          </h3>
          <p className="text-gray-400 text-sm truncate mb-2">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`${getMatchColor(
                track.matchScore
              )} text-white text-xs font-bold px-3 py-1 rounded-full`}
            >
              {track.matchScore}% · {getMatchLabel(track.matchScore)}
            </div>
            <div className="flex-1 bg-gray-600 rounded-full h-2 min-w-[100px] max-w-[200px]">
              <div
                className={`${getMatchColor(
                  track.matchScore
                )} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${track.matchScore}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onPlay(track.uri)}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all hover:scale-110"
            title="Play Now"
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            onClick={() => onQueue(track.uri)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-all hover:scale-110"
            title="Add to Queue"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
