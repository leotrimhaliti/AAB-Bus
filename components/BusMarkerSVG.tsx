import React from 'react';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface BusMarkerSVGProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

export const BusMarkerSVG: React.FC<BusMarkerSVGProps> = ({ 
  size = 48, 
  color = '#c62829',
  isActive = false,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={isActive ? '#ff5252' : '#8b1a1a'} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Outer glow for active state */}
      {isActive && (
        <Circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
        />
      )}
      
      {/* Main circle background */}
      <Circle
        cx="24"
        cy="24"
        r="18"
        fill="url(#busGradient)"
      />
      
      {/* Bus icon */}
      <G transform="translate(10, 10)">
        {/* Bus body */}
        <Path
          d="M6 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-1v2h-2v-2H9v2H7v-2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          fill="white"
        />
        {/* Windows */}
        <Path
          d="M8 7h4v3H8zM16 7h4v3h-4z"
          fill={color}
          opacity="0.8"
        />
        {/* Wheels */}
        <Circle cx="10" cy="18" r="1.5" fill="white" />
        <Circle cx="18" cy="18" r="1.5" fill="white" />
        {/* Front lights */}
        <Circle cx="8" cy="6" r="0.5" fill="white" opacity="0.9" />
        <Circle cx="20" cy="6" r="0.5" fill="white" opacity="0.9" />
      </G>
    </Svg>
  );
};

export const StopMarkerSVG: React.FC<{ size?: number; passed?: boolean }> = ({ 
  size = 32,
  passed = false,
}) => {
  const color = passed ? '#9e9e9e' : '#c62829';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="stopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={passed ? '#757575' : '#8b1a1a'} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Pin shape */}
      <Path
        d="M16 2c-4.418 0-8 3.582-8 8 0 6 8 16 8 16s8-10 8-16c0-4.418-3.582-8-8-8z"
        fill="url(#stopGradient)"
      />
      
      {/* Inner circle */}
      <Circle
        cx="16"
        cy="10"
        r="3"
        fill="white"
      />
      
      {/* Check mark for passed stops */}
      {passed && (
        <Path
          d="M14.5 11.5l1.5 1.5 3-3"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
};
