import React from 'react';

interface SafetyNoticeProps {
  status: 'warn' | 'block';
  note?: string;
}

const SafetyNotice: React.FC<SafetyNoticeProps> = ({ status, note }) => (
  <div className={`relative overflow-hidden rounded-xl border-2 p-6 ${
    status === 'block'
      ? 'border-status-error bg-gradient-to-r from-status-error/10 to-status-error/5'
      : 'border-status-warning bg-gradient-to-r from-status-warning/10 to-status-warning/5'
  }`}>
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 ${
      status === 'block' ? 'bg-status-error/20' : 'bg-status-warning/20'
    }`}></div>
    <div className="relative flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status === 'block' ? 'bg-status-error' : 'bg-status-warning'
        }`}>
          <span className="text-white font-bold text-lg">🛡</span>
        </div>
      </div>
      <div className="flex-1">
        <h4 className={`font-bold mb-2 font-mono text-lg ${
          status === 'block' ? 'text-status-error' : 'text-status-warning'
        }`}>
          SAFETY NOTICE
        </h4>
        <p className={`font-mono text-sm ${
          status === 'block' ? 'text-status-error' : 'text-status-warning'
        }`}>
          {note || ''}
        </p>
      </div>
    </div>
  </div>
);

export default SafetyNotice;
