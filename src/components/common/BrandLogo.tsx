import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSlogan = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Brand SVG Badge */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]} rounded-xl overflow-hidden bg-gradient-to-br from-[#071B35] via-[#0B2548] to-[#123F70] p-1 border border-[#FF8500]/40 shadow-lg shadow-[#FF8500]/10`}>
        <img
          src="/icon.svg"
          alt="CloMec Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,133,0,0.5)]"
        />
      </div>

      <div className="flex flex-col">
        <div className={`font-black tracking-wider leading-none font-industrial ${textSizes[size]}`}>
          <span className="text-white">CLO</span>
          <span className="text-[#FF8500]">MEC</span>
        </div>
        {showSlogan && (
          <span className="text-[10px] sm:text-xs font-semibold text-[#AEB8C4] tracking-widest uppercase mt-0.5 font-industrial">
            Qualidade • Segurança • Compromisso
          </span>
        )}
      </div>
    </div>
  );
};
