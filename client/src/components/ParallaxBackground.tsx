interface FloatingShape {
  id: number;
  type: "circle" | "ring" | "diamond" | "dot";
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  animationDelay: number;
}

const SHAPES: FloatingShape[] = [
  // Large, slow, far-away shapes
  { id: 1, type: "circle", x: 15, y: 20, size: 180, opacity: 0.12, animationDuration: 25, animationDelay: 0 },
  { id: 2, type: "ring", x: 75, y: 15, size: 100, opacity: 0.15, animationDuration: 30, animationDelay: -5 },
  { id: 3, type: "diamond", x: 85, y: 70, size: 70, opacity: 0.12, animationDuration: 22, animationDelay: -10 },

  // Medium shapes
  { id: 4, type: "dot", x: 40, y: 60, size: 12, opacity: 0.2, animationDuration: 18, animationDelay: -3 },
  { id: 5, type: "circle", x: 60, y: 80, size: 60, opacity: 0.1, animationDuration: 20, animationDelay: -8 },
  { id: 6, type: "ring", x: 25, y: 75, size: 65, opacity: 0.12, animationDuration: 28, animationDelay: -12 },
  { id: 7, type: "diamond", x: 50, y: 30, size: 45, opacity: 0.1, animationDuration: 24, animationDelay: -6 },

  // Small, faster, closer shapes
  { id: 8, type: "dot", x: 10, y: 45, size: 10, opacity: 0.25, animationDuration: 15, animationDelay: -2 },
  { id: 9, type: "dot", x: 90, y: 40, size: 8, opacity: 0.2, animationDuration: 12, animationDelay: -7 },
  { id: 10, type: "circle", x: 70, y: 55, size: 35, opacity: 0.1, animationDuration: 16, animationDelay: -4 },
  { id: 11, type: "dot", x: 35, y: 90, size: 7, opacity: 0.25, animationDuration: 14, animationDelay: -9 },
  { id: 12, type: "diamond", x: 55, y: 10, size: 30, opacity: 0.1, animationDuration: 19, animationDelay: -1 },
];

function getShapeStyle(shape: FloatingShape): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: `${shape.x}%`,
    top: `${shape.y}%`,
    width: shape.size,
    height: shape.size,
    opacity: shape.opacity,
    animation: `parallax-drift ${shape.animationDuration}s ease-in-out ${shape.animationDelay}s infinite`,
    pointerEvents: "none",
  };

  switch (shape.type) {
    case "circle":
      return { ...base, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)" };
    case "ring":
      return { ...base, borderRadius: "50%", border: "1.5px solid rgba(139,92,246,0.8)", background: "transparent" };
    case "diamond":
      return { ...base, transform: "rotate(45deg)", borderRadius: "4px", background: "linear-gradient(135deg, rgba(56,189,248,0.6), transparent)" };
    case "dot":
      return { ...base, borderRadius: "50%", background: "rgba(167,139,250,1)" };
  }
}

export function ParallaxBackground() {
  return (
    <div
      className="parallax-bg"
      aria-hidden="true"
      data-testid="parallax-background"
    >
      {SHAPES.map((shape) => (
        <div
          key={shape.id}
          style={getShapeStyle(shape)}
          data-testid={`parallax-shape-${shape.id}`}
        />
      ))}
    </div>
  );
}
