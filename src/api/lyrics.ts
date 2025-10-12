export async function getLyrics(
  artist: string,
  title: string
): Promise<string> {
  try {
    const queryArtist = encodeURIComponent(artist);
    const queryTitle = encodeURIComponent(title);
    const url = `https://api.lyrics.ovh/v1/${queryArtist}/${queryTitle}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Lyrics not found for ${artist} - ${title}`);
    }

    const data = await res.json();
    console.log(data,'data')
    return data?.lyrics || "Lirik tidak ditemukan 😢";
  } catch (err) {
    return "Gagal memuat lirik.";
  }
}
