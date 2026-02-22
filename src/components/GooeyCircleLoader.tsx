import React from 'react';
import './GooeyCircleLoader.css';

interface GooeyCircleLoaderProps {
  loading?: boolean;
  size?: number;
  colors?: string[];
}

const GooeyCircleLoader: React.FC<GooeyCircleLoaderProps> = ({
  loading = true,
  size = 100,
  colors = ['#2563EB'],
}) => {
  if (!loading) return null;

  const color = colors[0] || '#2563EB';
  const strokeWidth = Math.max(2, size * 0.06);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.2,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ animation: 'klaro-spin 0.9s linear infinite' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
};

export default GooeyCircleLoader;
