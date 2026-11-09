// Animated floating gradient blob background
export default function AnimatedBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="blob blob-1 absolute"
        style={{
          width: '500px', height: '500px',
          top: '-100px', left: '-100px',
          animationDuration: '14s',
        }}
      />
      <div
        className="blob blob-2 absolute"
        style={{
          width: '400px', height: '400px',
          bottom: '-80px', right: '-80px',
          animationDuration: '18s',
        }}
      />
      <div
        className="blob blob-3 absolute"
        style={{
          width: '300px', height: '300px',
          top: '50%', left: '60%',
          animationDuration: '22s',
        }}
      />
    </div>
  );
}
