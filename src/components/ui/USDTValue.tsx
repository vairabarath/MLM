import React from 'react';

interface USDTValueProps {
  usdtAmount: number;
  className?: string;
  decimals?: number;
}

const USDTValue: React.FC<USDTValueProps> = ({
  usdtAmount,
  className = "text-green-400 font-bold",
  decimals = 2
}) => {
  const formatUSDT = (amount: number) => {
    return amount.toFixed(decimals);
  };

  return (
    <span className={className}>
      {formatUSDT(usdtAmount)} USDT
    </span>
  );
};

export default USDTValue;
