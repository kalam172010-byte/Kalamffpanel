import React from 'react';
import { motion } from 'motion/react';
import { Wallet, ShoppingCart, Key, ArrowRight, ShieldCheck, Zap, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface StepByStepGuideProps {
  onOpenDeposit: () => void;
  onOpenStore: () => void;
  onOpenMyKeys: () => void;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  onOpenDeposit,
  onOpenStore,
  onOpenMyKeys,
}) => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Deposit Cash',
      subtitle: 'Scan QR & pay exact amount with 0% fees. Instant auto-credit.',
      icon: Wallet,
      badge: 'Step 1',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      buttonText: 'Deposit Now',
      buttonAction: onOpenDeposit,
      buttonStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40',
      accentBorder: 'hover:border-emerald-500/50',
      gradient: 'from-emerald-950/30 to-[#121320]',
    },
    {
      stepNumber: '02',
      title: 'Pick Product & Plan',
      subtitle: 'Choose Free Fire, BGMI, or 8 Ball Pool duration (1D, 7D, 30D).',
      icon: ShoppingCart,
      badge: 'Step 2',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      buttonText: 'Open Store',
      buttonAction: onOpenStore,
      buttonStyle: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40',
      accentBorder: 'hover:border-cyan-500/50',
      gradient: 'from-cyan-950/30 to-[#121320]',
    },
    {
      stepNumber: '03',
      title: 'Instant Key & Setup',
      subtitle: 'Receive license key instantly. 1-tap copy, APK download & video.',
      icon: Key,
      badge: 'Step 3',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      buttonText: 'View My Keys',
      buttonAction: onOpenMyKeys,
      buttonStyle: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40',
      accentBorder: 'hover:border-purple-500/50',
      gradient: 'from-purple-950/30 to-[#121320]',
    },
  ];

  return (
    <div id="step-by-step-guide-section" className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#00e5ff] flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>HOW IT WORKS (STEP-BY-STEP)</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono border border-purple-500/30">
                3 EASY STEPS
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
          100% Automated • 24/7 Delivery
        </span>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.stepNumber}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-2xl bg-gradient-to-b ${s.gradient} bg-[#121320] border border-white/10 ${s.accentBorder} transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg group`}
            >
              {/* Background Step Watermark */}
              <span className="absolute -right-2 -top-2 text-5xl font-black text-white/[0.03] group-hover:text-white/[0.07] transition-colors select-none font-mono pointer-events-none">
                {s.stepNumber}
              </span>

              <div className="space-y-2 relative z-10">
                {/* Step Pill & Icon */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${s.badgeColor}`}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {s.badge}
                  </span>

                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-200 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>{s.title}</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-0.5">
                    {s.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={s.buttonAction}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${s.buttonStyle} relative z-10 active:scale-[0.98]`}
              >
                <span>{s.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
