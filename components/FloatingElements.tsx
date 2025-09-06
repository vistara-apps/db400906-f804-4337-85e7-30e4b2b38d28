'use client';

export function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full floating-element opacity-60" 
           style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400 rounded-full floating-element opacity-40" 
           style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-cyan-400 rounded-full floating-element opacity-70" 
           style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-10 w-5 h-5 bg-purple-300 rounded-full floating-element opacity-50" 
           style={{ animationDelay: '0.5s' }} />
      
      {/* Floating icons/shapes */}
      <div className="absolute top-60 left-1/4 floating-element opacity-30" style={{ animationDelay: '1.5s' }}>
        <div className="w-8 h-8 border-2 border-white rounded-lg rotate-45" />
      </div>
      <div className="absolute bottom-60 right-1/4 floating-element opacity-40" style={{ animationDelay: '2.5s' }}>
        <div className="w-6 h-6 border-2 border-cyan-400 rounded-full" />
      </div>
      
      {/* Constellation-like connections */}
      <svg className="absolute inset-0 w-full h-full opacity-20" style={{ animationDelay: '3s' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" />
        <line x1="70%" y1="30%" x2="90%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
        <line x1="20%" y1="70%" x2="40%" y2="90%" stroke="url(#lineGradient)" strokeWidth="1" />
      </svg>
    </div>
  );
}
