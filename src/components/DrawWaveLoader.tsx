import React from 'react';
import '../styles/DrawWaveLoader.css';

interface DrawWaveLoaderProps {
  loading?: boolean;
  size?: number;
  duration?: number;
  colors?: string[];
}

const DrawWaveLoader: React.FC<DrawWaveLoaderProps> = ({
  loading = true,
  size = 100,
  duration = 1.5,
  colors = ['#5e72e4', '#825ee4', '#5e72e4']
}) => {
  if (!loading) return null;

  const waveStyle = {
    width: size,
    height: size,
    '--wave-duration': `${duration}s`,
    '--wave-color-1': colors[0],
    '--wave-color-2': colors[1] || colors[0],
    '--wave-color-3': colors[2] || colors[0],
  } as React.CSSProperties;

  return (
    <div className="draw-wave-loader" style={waveStyle}>
      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>
    </div>
  );
};

export default DrawWaveLoader;
