import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Copy,
  Key,
  Download,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { PurchasedKey } from '../../types';

interface KeySuccessModalProps {
  purchasedKey: PurchasedKey | null;
  onClose: () => void;
  onGoToMyKeys: () => void;
}

export const KeySuccessModal: React.FC<KeySuccessModalProps> = ({
  purchasedKey,
  onClose,
  onGoToMyKeys,
}) => {
  const [copied, setCopied] = useState(false);

  if (!purchasedKey) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(purchasedKey.keyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="relative z-50 w-full max-w-sm bg-[#161622] border border-emerald-500/40 rounded-3xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)] text-white space-y-4"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                  Key Generated Successfully!
                </h3>
                <span className="text-[10px] text-gray-400">Instant Screen Delivery</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product & Plan Details */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
              {purchasedKey.planName} PLAN
            </span>
            <h4 className="text-sm font-extrabold text-white">{purchasedKey.productName}</h4>
            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
              <span>Paid Amount:</span>
              <span className="font-mono font-bold text-emerald-400">₹{purchasedKey.price}</span>
            </div>
          </div>

          {/* Key Code Display & Copy Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Your License Key Code:
            </span>
            <div className="p-3 rounded-2xl bg-[#0a0a0f] border border-cyan-500/50 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <span className="font-mono text-sm font-black text-[#00e5ff] tracking-wide select-all truncate">
                {purchasedKey.keyCode}
              </span>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onGoToMyKeys();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Key className="w-4 h-4" />
              <span>View In My Keys Storage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="https://t.me/Kalam_Mods_Official"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all block text-center"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
              <span>Download Loader APK in Telegram</span>
              <ExternalLink className="w-3 h-3 text-gray-500 inline ml-1" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
