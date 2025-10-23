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
const PlaylistSidebar = ({ playlists, onSelectPlaylist, onRefresh }) => {
  return (
    <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <List className="w-5 h-5" />
          Your Playlists
        </h2>
        <button
          onClick={onRefresh}
          className="text-green-500 hover:text-green-400 transition-colors"
          title="Refresh playlists"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
        {playlists.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No playlists found
          </p>
        ) : (
          playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className="w-full text-left bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {playlist.images && playlist.images[0] ? (
                  <img
                    src={playlist.images[0].url}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-600 flex items-center justify-center">
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                    {playlist.name}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {playlist.tracks.total} tracks
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistSidebar;
