interface AlbumArtBackgroundProps {
  imageUrl: string | null;
  opacity?: number;
}

export function AlbumArtBackground({ imageUrl, opacity = 0.3 }: AlbumArtBackgroundProps) {
  if (!imageUrl) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Blurred album art */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-150 blur-2xl"
        style={{ opacity }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/70" />
    </div>
  );
}
