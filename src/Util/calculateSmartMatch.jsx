export const calculateSmartMatch = (
  original,
  recommended,
  originalTrack,
  recommendedTrack
) => {
  if (!original || !recommended) return 50;

  let score = 0;
  let penalties = 0;

  // Core audio feature matching (60% weight)
  const energyDiff = Math.abs(original.energy - recommended.energy);
  const danceabilityDiff = Math.abs(
    original.danceability - recommended.danceability
  );
  const valenceDiff = Math.abs(original.valence - recommended.valence);

  score += (1 - energyDiff) * 20;
  score += (1 - danceabilityDiff) * 20;
  score += (1 - valenceDiff) * 20;

  // Tempo matching with smart ranges (15% weight)
  const tempoDiff = Math.abs(original.tempo - recommended.tempo);
  let tempoScore = 0;
  if (tempoDiff < 10) tempoScore = 15;
  else if (tempoDiff < 20) tempoScore = 12;
  else if (tempoDiff < 30) tempoScore = 8;
  else if (tempoDiff < 50) tempoScore = 5;
  score += tempoScore;

  // Key matching (5% weight) - same key is a bonus
  if (original.key === recommended.key && original.key !== -1) {
    score += 5;
  }

  // Mode matching (5% weight) - major/minor
  if (original.mode === recommended.mode) {
    score += 5;
  }

  // Acousticness similarity (5% weight)
  const acousticnessDiff = Math.abs(
    original.acousticness - recommended.acousticness
  );
  score += (1 - acousticnessDiff) * 5;

  // Instrumentalness similarity (5% weight)
  const instrumentalnessDiff = Math.abs(
    original.instrumentalness - recommended.instrumentalness
  );
  score += (1 - instrumentalnessDiff) * 5;

  // Loudness similarity (5% weight)
  const loudnessDiff = Math.abs(original.loudness - recommended.loudness) / 60;
  score += (1 - Math.min(loudnessDiff, 1)) * 5;

  // PENALTIES for dissimilar tracks

  // Extreme difference in energy levels
  if (energyDiff > 0.4) penalties += 15;

  // Very different danceability
  if (danceabilityDiff > 0.4) penalties += 10;

  // Opposite mood (happy vs sad)
  if (valenceDiff > 0.5) penalties += 10;

  // Very different tempo (beyond 50 BPM)
  if (tempoDiff > 50) penalties += 10;

  // Extreme difference in acousticness (acoustic vs electronic)
  const acousticDiff = Math.abs(
    original.acousticness - recommended.acousticness
  );
  if (acousticDiff > 0.6) penalties += 8;

  // Speechiness difference (music vs spoken word)
  const speechinessDiff = Math.abs(
    original.speechiness - recommended.speechiness
  );
  if (speechinessDiff > 0.4) penalties += 8;

  // Check for artist overlap (bonus)
  if (originalTrack && recommendedTrack) {
    const originalArtists = originalTrack.artists.map((a) => a.id);
    const recommendedArtists = recommendedTrack.artists.map((a) => a.id);
    const hasCommonArtist = originalArtists.some((id) =>
      recommendedArtists.includes(id)
    );
    if (hasCommonArtist) {
      score += 10; // Bonus for same artist
    }
  }

  // Apply penalties
  score = Math.max(0, score - penalties);

  return Math.round(Math.min(100, Math.max(0, score)));
};
