import React from 'react';
import '../styles/GooeyCircleLoader.css';

interface GooeyCircleLoaderProps {
  loading?: boolean;
  size?: number;
  duration?: number;
  colors?: string[];
}

const GooeyCircleLoader: React.FC<GooeyCircleLoaderProps> = ({
  loading = true,
  size = 100,
  duration = 1.5,
  colors = ['#5e72e4', '#825ee4', '#5e72e4']
}) => {
  if (!loading) return null;

  const containerStyle = {
    width: size,
    height: size,
    '--loader-size': `${size}px`,
    '--loader-duration': `${duration}s`,
    '--color-1': colors[0],
    '--color-2': colors[1] || colors[0],
    '--color-3': colors[2] || colors[0],
  } as React.CSSProperties;

  return (
    <div className="gooey-circle-loader" style={containerStyle}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="gooey-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="gooey"
            />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>
      <div className="gooey-circles">
        <div className="gooey-circle circle-1"></div>
        <div className="gooey-circle circle-2"></div>
        <div className="gooey-circle circle-3"></div>
      </div>
    </div>
  );
};

export default GooeyCircleLoader;
