interface Props {
  lines?: number;
  height?: number;
  className?: string;
}

export default function LoadingSkeleton({ lines = 3, height = 16, className = '' }: Props) {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            height,
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
