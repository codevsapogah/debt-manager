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
  colors = ['#5e72e4', '#825ee4', '#ef5777']
}) => {
  if (!loading) return null;

  return (
    <div className="gooey-loader-container" style={{ width: size, height: size }}>
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
      <div className="gooey-loader" style={{
        width: size,
        height: size,
        '--color-1': colors[0],
        '--color-2': colors[1] || colors[0],
        '--color-3': colors[2] || colors[0],
      } as React.CSSProperties}>
        <div className="gooey-dot" style={{ '--delay': '0s' } as React.CSSProperties}></div>
        <div className="gooey-dot" style={{ '--delay': '0.1s' } as React.CSSProperties}></div>
        <div className="gooey-dot" style={{ '--delay': '0.2s' } as React.CSSProperties}></div>
      </div>
    </div>
  );
};

export default GooeyCircleLoader;
