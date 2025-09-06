'use client';

import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { Name } from '@coinbase/onchainkit/identity';

export function Header() {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">
            SpeakEasy Tasks
          </h1>
        </div>
        
        <Wallet>
          <ConnectWallet className="glass-button px-4 py-2 text-white">
            <Name className="text-white" />
          </ConnectWallet>
        </Wallet>
      </div>
    </header>
  );
}
