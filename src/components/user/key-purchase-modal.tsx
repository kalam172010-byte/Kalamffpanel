import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  Check,
  Copy,
  AlertCircle,
  X,
  ShieldCheck,
  Zap,
  Server,
  Cpu,
  Wifi,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  FileText
} from 'lucide-react';
import { Product, PlanPricing, PurchasedKey, PurchaseInvoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

export type PurchaseStage = 'CONNECTING' | 'REQUESTING_KEY' | 'FINALIZING' | 'SUCCESS' | 'ERROR';

export interface KeyPurchaseModalData {
  product: Product;
  plan: PlanPricing;
  quantity: number;
  totalCost: number;
  discountAmount?: number;
  couponCode?: string;
  stage: PurchaseStage;
  label: string;
  subLabel: string;
  progressPercent: number;
  error?: string;
  deliveredKeys?: string[];
  purchasedKeyRecord?: PurchasedKey;
  invoice?: PurchaseInvoice;
}

interface KeyPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseData: KeyPurchaseModalData | null;
  onRetry?: () => void;
  onGoToMyKeys?: () => void;
  onViewInvoice?: (invoice: PurchaseInvoice) => void;
}

export const KeyPurchaseModal: React.FC<KeyPurchaseModalProps> = ({
  isOpen,
  onClose,
  purchaseData,
  onRetry,
  onGoToMyKeys,
  onViewInvoice,
}) => {
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen || !purchaseData) return null;

  const {
    product,
    plan,
    quantity,
    totalCost,
    stage,
    label,
    subLabel,
    progressPercent,
    error,
    deliveredKeys = [],
    purchasedKeyRecord,
    invoice,
  } = purchaseData;

  const handleCopySingle = (keyStr: string, idx: number) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (deliveredKeys.length > 0) {
      navigator.clipboard.writeText(deliveredKeys.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else if (purchasedKeyRecord?.keyCode) {
      navigator.clipboard.writeText(purchasedKeyRecord.keyCode);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Stage milestone progression helpers
  const getStepStatus = (stepStage: 'CONNECTING' | 'REQUESTING_KEY' | 'FINALIZING') => {
    if (stage === 'ERROR') return 'error';
    if (stage === 'SUCCESS') return 'completed';

    const order = ['CONNECTING', 'REQUESTING_KEY', 'FINALIZING'];
    const currentIndex = order.indexOf(stage);
    const stepIndex = order.indexOf(stepStage);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  const connectingStatus = getStepStatus('CONNECTING');
  const requestingStatus = getStepStatus('REQUESTING_KEY');
  const finalizingStatus = getStepStatus('FINALIZING');

  // Dynamic progress bar styling based on stage
  const getBarGradient = () => {
    switch (stage) {
      case 'CONNECTING':
        return 'from-[#00e5ff] via-[#00b4d8] to-[#0077b6]';
      case 'REQUESTING_KEY':
        return 'from-[#8b5cf6] via-[#a855f7] to-[#ec4899]';
      case 'FINALIZING':
        return 'from-[#00e5ff] via-[#8b5cf6] to-[#10b981]';
      case 'SUCCESS':
        return 'from-[#10b981] via-[#059669] to-[#34d399]';
      case 'ERROR':
        return 'from-rose-600 via-red-500 to-rose-700';
      default:
        return 'from-cyan-500 to-purple-600';
    }
  };

  const isProcessing = stage === 'CONNECTING' || stage === 'REQUESTING_KEY' || stage === 'FINALIZING';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isProcessing) onClose();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-50 w-full max-w-md bg-[#13121f] border border-[#8b5cf6]/35 rounded-[28px] p-5 sm:p-6 shadow-[0_0_50px_rgba(139,92,246,0.3)] text-white space-y-4.5 overflow-hidden"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8b5cf6]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00e5ff]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all ${
                  stage === 'SUCCESS'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : stage === 'ERROR'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-[#8b5cf6]/20 border-[#8b5cf6]/50 text-[#c084fc] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                }`}
              >
                {stage === 'SUCCESS' ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : stage === 'ERROR' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
                  <span>{stage === 'SUCCESS' ? 'Key Delivery Complete' : stage === 'ERROR' ? 'Purchase Interrupted' : 'Processing Key Purchase'}</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {stage === 'SUCCESS' ? 'License Generated & Active' : 'Automated Upstream Delivery Engine'}
                </span>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Product & Order Details Card */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {product.category || 'DIGITAL KEY'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {plan.duration} • Qty: {quantity}
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white truncate">{product.name}</h4>
            {purchaseData.discountAmount && purchaseData.discountAmount > 0 ? (
              <div className="flex items-center justify-between text-[11px] text-yellow-300 font-semibold bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                <span>Promo Discount ({purchaseData.couponCode || 'PROMO'}):</span>
                <span>-{formatCurrency(purchaseData.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
              <span className="text-gray-400 text-[11px]">Total Deducted Amount:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LINEAR PROGRESS BAR SECTION */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-[#0e0c1a] border border-[#8b5cf6]/30 space-y-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            {/* Stage Title & Percentage Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isProcessing && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
                <span className="text-xs font-black text-white tracking-wide uppercase">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                <span
                  className={
                    stage === 'SUCCESS'
                      ? 'text-emerald-400'
                      : stage === 'ERROR'
                      ? 'text-rose-400'
                      : 'text-[#00e5ff]'
                  }
                >
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>

            {/* Linear Progress Bar Track */}
            <div className="w-full bg-black/80 rounded-full h-3 p-0.5 border border-white/15 relative overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${getBarGradient()} relative shadow-[0_0_12px_rgba(0,229,255,0.6)]`}
              >
                {/* Animated Light Shimmer Effect */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />
                )}
              </motion.div>
            </div>

            {/* Detailed Real-Time Status Subtitle */}
            <div className="flex items-start gap-1.5 text-[11px] text-gray-300 font-medium">
              <span className="text-gray-400 shrink-0">Status:</span>
              <p className="flex-1 font-sans leading-tight">
                {subLabel || 'Processing digital key license verification...'}
              </p>
            </div>

            {/* 3 Step Milestone Indicators: Connecting -> Requesting Key -> Finalizing */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-[10px]">
              {/* 1. Connecting */}
              <div
                className={`p-2 rounded-xl flex flex-col items-center text-center gap-1 transition-all ${
                  connectingStatus === 'completed'
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : connectingStatus === 'active'
                    ? 'bg-cyan-950/60 border border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                    : 'bg-white/5 border border-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  {connectingStatus === 'completed' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Wifi className={`w-3 h-3 ${connectingStatus === 'active' ? 'text-cyan-400 animate-pulse' : ''}`} />
                  )}
                  <span>1. Connecting</span>
                </div>
                <span className="text-[9px] text-gray-400 truncate">Gateway Sync</span>
              </div>

              {/* 2. Requesting Key */}
              <div
                className={`p-2 rounded-xl flex flex-col items-center text-center gap-1 transition-all ${
                  requestingStatus === 'completed'
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : requestingStatus === 'active'
                    ? 'bg-purple-950/60 border border-purple-400/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                    : 'bg-white/5 border border-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  {requestingStatus === 'completed' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Key className={`w-3 h-3 ${requestingStatus === 'active' ? 'text-purple-400 animate-pulse' : ''}`} />
                  )}
                  <span>2. Requesting</span>
                </div>
                <span className="text-[9px] text-gray-400 truncate">License Server</span>
              </div>

              {/* 3. Finalizing */}
              <div
                className={`p-2 rounded-xl flex flex-col items-center text-center gap-1 transition-all ${
                  finalizingStatus === 'completed'
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : finalizingStatus === 'active'
                    ? 'bg-emerald-950/60 border border-emerald-400/60 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border border-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  {finalizingStatus === 'completed' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ShieldCheck className={`w-3 h-3 ${finalizingStatus === 'active' ? 'text-emerald-400 animate-pulse' : ''}`} />
                  )}
                  <span>3. Finalizing</span>
                </div>
                <span className="text-[9px] text-gray-400 truncate">Delivery &amp; Sync</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STAGE RESULT: SUCCESS WITH REAL KEYS */}
          {/* ========================================================================= */}
          {stage === 'SUCCESS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Delivered License Key ({deliveredKeys.length || 1}):</span>
                </span>

                {(deliveredKeys.length > 1 || (deliveredKeys.length === 0 && purchasedKeyRecord?.keyCode)) && (
                  <button
                    onClick={handleCopyAll}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAll ? 'Copied All!' : 'Copy All Keys'}</span>
                  </button>
                )}
              </div>

              {/* Keys List Display */}
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {deliveredKeys.length > 0 ? (
                  deliveredKeys.map((k, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#0a0a10] border border-cyan-500/40 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                    >
                      <span className="font-mono text-xs sm:text-sm font-black text-[#00e5ff] tracking-wide select-all truncate">
                        {k}
                      </span>
                      <button
                        onClick={() => handleCopySingle(k, idx)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all border border-cyan-400/40"
                      >
                        {copiedKeyIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : purchasedKeyRecord?.keyCode ? (
                  <div className="p-3 rounded-2xl bg-[#0a0a10] border border-cyan-500/40 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                    <span className="font-mono text-xs sm:text-sm font-black text-[#00e5ff] tracking-wide select-all truncate">
                      {purchasedKeyRecord.keyCode}
                    </span>
                    <button
                      onClick={() => handleCopySingle(purchasedKeyRecord.keyCode, 0)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all border border-cyan-400/40"
                    >
                      {copiedKeyIndex === 0 ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Generate / View Official Invoice Button */}
                {invoice && onViewInvoice && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onViewInvoice(invoice);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Official Invoice &amp; Receipt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onClose}
                    className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-colors text-center"
                  >
                    Close Window
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onGoToMyKeys) onGoToMyKeys();
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>View in My Keys</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STAGE RESULT: ERROR / OUT OF STOCK */}
          {/* ========================================================================= */}
          {stage === 'ERROR' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-1"
            >
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Key Delivery Notice:</span>
                  <p className="text-[11px] text-rose-200 leading-normal">
                    {error || 'The requested license is currently unavailable from inventory and upstream servers. Your wallet balance has NOT been deducted.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onClose}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
