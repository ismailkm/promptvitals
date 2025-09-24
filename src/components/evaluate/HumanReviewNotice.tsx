import React from 'react';

interface HumanReviewNoticeProps {
  reason?: string;
}

const HumanReviewNotice: React.FC<HumanReviewNoticeProps> = ({ reason }) => (
  <div className="relative overflow-hidden rounded-xl border-2 border-electric-yellow bg-gradient-to-r from-electric-yellow/10 to-electric-yellow/5 p-6">
    <div className="absolute top-0 right-0 w-20 h-20 bg-electric-yellow/20 rounded-full -mr-10 -mt-10"></div>
    <div className="relative flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-electric-yellow flex items-center justify-center">
          <span className="text-slate-900 font-bold text-lg">⚠</span>
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-electric-yellow mb-2 font-mono text-lg">
          HUMAN REVIEW REQUIRED
        </h4>
        <p className="text-slate-200 font-mono text-sm mb-3">
          This prompt requires manual review before proceeding
        </p>
        {reason && (
          <div className="bg-slate-900/60 rounded-lg p-3 border-l-4 border-electric-yellow">
            <p className="text-electric-yellow font-mono text-sm">
              <strong>Reason:</strong> {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default HumanReviewNotice;
