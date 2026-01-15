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

  const loaderStyle = {
    width: size,
    height: size,
    '--duration': `${duration}s`,
    '--color-1': colors[0],
    '--color-2': colors[1] || colors[0],
    '--color-3': colors[2] || colors[0],
  } as React.CSSProperties;

  return (
    <div className="gooey-circle-loader" style={loaderStyle}>
      <svg width="0" height="0">
        <defs>
          <filter id="gooey-filter">
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
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
        <div className="circle circle4"></div>
        <div className="circle circle5"></div>
        <div className="circle circle6"></div>
      </div>
    </div>
  );
};

export default GooeyCircleLoader;
