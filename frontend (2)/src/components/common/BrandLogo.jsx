import React from 'react';

export const BrandLogo = ({ variant = 'light', size = 'default', showSubtitle = true }) => {
  const logoWidth = size === 'small' ? 140 : size === 'medium' ? 240 : 180;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
      <img 
        src="/8EC89543-6E36-46D6-B776-4E8E576C5580.png" 
        alt="Company Logo" 
        crossOrigin="anonymous"
        style={{ 
          width: logoWidth, 
          height: 'auto',
          maxHeight: '80px',
          objectFit: 'contain',
          transform: 'scale(0.9)',
          transformOrigin: 'left center'
        }} 
      />
    </div>
  );
};
