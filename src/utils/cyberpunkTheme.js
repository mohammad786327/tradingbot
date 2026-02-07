export const theme = {
  colors: {
    bg: 'bg-[#0f0f0f]',
    card: 'bg-[#1a1a1a]/80 backdrop-blur-md border border-white/5',
    cardHover: 'hover:border-green-500/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]',
    text: {
      primary: 'text-white',
      secondary: 'text-gray-400',
      accent: 'text-cyan-400',
      success: 'text-green-400',
      danger: 'text-red-400',
      warning: 'text-yellow-400',
    },
    border: 'border-[#2a2a2a]',
    accent: {
      cyan: 'cyan-400',
      green: 'green-400',
      purple: 'purple-500',
    },
    liquidation: {
      long: {
        primary: '#ef4444', // Longs get liquidated by price drop (Red)
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
      },
      short: {
        primary: '#22c55e', // Shorts get liquidated by price rise (Green)
        bg: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 0.3)',
      }
    }
  },
  animation: {
    transition: 'transition-all duration-300 ease-in-out',
    glow: 'animate-pulse',
  },
  layout: {
    grid: 'grid gap-6',
    section: 'p-6 rounded-2xl',
  }
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercentage = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};