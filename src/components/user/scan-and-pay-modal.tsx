import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Lock,
  Smartphone,
  Scan,
  Grid,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { safeFetchJson } from '../../lib/safe-api';
import { LottieSuccessAnimation } from './lottie-success-animation';

interface ScanAndPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: (amount: number) => void;
  storeSettings?: StoreSettings;
  customOrderId?: string;
  merchantName?: string;
}

export const ScanAndPayModal: React.FC<ScanAndPayModalProps> = ({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess,
  storeSettings,
  customOrderId,
  merchantName = 'KALAM FF PANEL',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes timer
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(true);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [pollingTick, setPollingTick] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Waiting for payment... Complete the transfer in your UPI app');
  const [orderId] = useState<string>(() => customOrderId || `TXN${Math.floor(100000 + Math.random() * 900000)}K`);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isUtrVerifying, setIsUtrVerifying] = useState<boolean>(false);
  const [activeAppToast, setActiveAppToast] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [paymentFailedState, setPaymentFailedState] = useState<{
    status: 'FAILED' | 'EXPIRED';
    message: string;
  } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const activeUpiId = (storeSettings as any)?.upiManualId || (storeSettings as any)?.upiId || '8056317218@fam';
  const activeMerchantName = storeSettings?.upiMerchantName || storeSettings?.merchantUpi || merchantName;
  const qrUpiIntent = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchantName)}&tr=${orderId}&am=${amount}&cu=INR`;

  // Countdown timer from 05:00
  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(300);
      setIsSuccess(false);
      setPaymentFailedState(null);
      setStatusMessage('Waiting for payment... Complete the transfer in your UPI app');
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle countdown timeout expiry
  useEffect(() => {
    if (isOpen && secondsRemaining === 0 && !isSuccess && !paymentFailedState) {
      setPaymentFailedState({
        status: 'EXPIRED',
        message: 'Payment session expired (5:00 min). This QR code is no longer active.'
      });
      setIsAutoChecking(false);
      setVerifyError('Session timed out. Please generate a new order.');
    }
  }, [isOpen, secondsRemaining, isSuccess, paymentFailedState]);

  // Real-time automatic payment verification polling (Every 2.5s)
  useEffect(() => {
    if (!isOpen || isSuccess || paymentFailedState) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        setPollingTick((prev) => prev + 1);
        const res = await fetch(`/api/check-payment/${orderId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data?.isPaid === true && data?.status === 'SUCCESS') {
          setIsSuccess(true);
          setIsAutoChecking(false);
          setPaymentFailedState(null);
          setStatusMessage('Payment detected and verified! Crediting wallet...');
          const verifiedAmount = data?.amount || amount;
          onPaymentSuccess(verifiedAmount);
          setTimeout(() => {
            if (isMounted) {
              onClose();
            }
          }, 3200);
        } else if (
          data?.status === 'FAILED' ||
          data?.status === 'EXPIRED' ||
          data?.status === 'CANCELLED' ||
          data?.status === 'REJECTED' ||
          data?.status === 'TIMEOUT' ||
          (data?.success === false && data?.status && data.status !== 'PENDING')
        ) {
          const isExp = data.status === 'EXPIRED' || data.status === 'TIMEOUT';
          const errorMsg =
            data.message ||
            (isExp
              ? 'Order has expired. Please initiate a new deposit.'
              : 'Payment failed or was cancelled by the bank.');

          setPaymentFailedState({
            status: isExp ? 'EXPIRED' : 'FAILED',
            message: errorMsg,
          });
          setIsAutoChecking(false);
          setVerifyError(errorMsg);
          clearInterval(interval);
        } else if (data?.message) {
          setStatusMessage(data.message || 'Waiting for payment... Auto-syncing with bank');
        }
      } catch (e) {
        // silent fail on poll
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, orderId, amount, isSuccess, onPaymentSuccess, onClose, paymentFailedState]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyTxn = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const handleSaveQrToGallery = () => {
    try {
      setIsSavingQr(true);
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        setIsSavingQr(false);
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 25, 25, 450, 450);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `UPI-QR-${orderId}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
        setIsSavingQr(false);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.warn('QR download error:', err);
      setIsSavingQr(false);
    }
  };

  const handleAppClick = (appName: string, customScheme?: string) => {
    setActiveAppToast(`Opening ${appName}...`);
    setTimeout(() => setActiveAppToast(null), 2500);

    if (customScheme) {
      window.location.href = customScheme;
    } else {
      window.location.href = qrUpiIntent;
    }
  };

  // Manual UTR Verification
  const handleVerifyUtr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUtr = utrNumber.trim().replace(/\D/g, '');
    if (!cleanUtr) {
      setVerifyError('Please enter the 12-digit UTR / Reference number from your UPI app.');
      return;
    }
    if (cleanUtr.length < 10 || cleanUtr.length > 22) {
      setVerifyError('Please enter a valid numeric 12-digit UPI UTR number.');
      return;
    }

    setIsUtrVerifying(true);
    setVerifyError(null);
    setStatusMessage('Verifying UTR with payment gateway...');

    try {
      const res = await safeFetchJson<any>('/api/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          utr: cleanUtr,
        }),
      });

      const data = res.data;
      if (data?.isPaid === true && data?.status === 'SUCCESS') {
        const verifiedAmount = data?.amount || amount;
        setIsSuccess(true);
        setStatusMessage('Payment verified successfully! Crediting ₹' + verifiedAmount + '...');
        onPaymentSuccess(verifiedAmount);
        setTimeout(() => {
          onClose();
        }, 3200);
      } else {
        setVerifyError(
          data?.message ||
          data?.error ||
          'Payment not detected on bank records for this UTR yet. Please complete UPI payment first.'
        );
        setStatusMessage('UTR verification returned pending.');
      }
    } catch (err: any) {
      setVerifyError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsUtrVerifying(false);
    }
  };

  // Instant Check / Auto-Detect trigger button
  const handleInstantAutoCheck = async () => {
    if (isManualChecking || isSuccess) return;
    setIsManualChecking(true);
    setVerifyError(null);
    setStatusMessage('Checking bank gateway for payment confirmation...');

    try {
      const cleanUtr = utrNumber.trim().replace(/\D/g, '');
      const res = await safeFetchJson<any>('/api/auto-detect-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          utr: cleanUtr || undefined,
        }),
      });

      const data = res.data;
      if (data?.isPaid === true && data?.status === 'SUCCESS') {
        const verifiedAmount = data?.amount || amount;
        setIsSuccess(true);
        setStatusMessage('Payment verified successfully! Crediting ₹' + verifiedAmount + '...');
        onPaymentSuccess(verifiedAmount);
        setTimeout(() => {
          onClose();
        }, 3200);
      } else {
        setStatusMessage('Waiting for transfer... Please complete payment in your UPI app.');
        setVerifyError(data?.message || 'Payment transfer not detected yet. Please complete the transfer in your UPI app.');
      }
    } catch (err) {
      setStatusMessage('Bank connection error. Please try again.');
      setVerifyError('Could not connect to payment gateway. Please try again in a few seconds.');
    } finally {
      setIsManualChecking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop with dark blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Master Frame */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            className="relative z-50 w-full max-w-[390px] my-auto"
          >
            <div className="rounded-[32px] bg-[#0c0919] border border-[#7c3aed]/25 p-5 text-white shadow-[0_0_60px_rgba(124,58,237,0.25)] space-y-4 relative overflow-hidden">
              
              {/* TOP APP BAR */}
              <div className="flex items-center justify-between pb-1">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <h2 className="text-base font-black text-white tracking-wide">
                    Instant UPI Payment
                  </h2>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 font-medium">
                    <span>Scan</span>
                    <span>•</span>
                    <span>Pay</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Auto-Credit</span>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              {isSuccess ? (
                /* SUCCESS STATE */
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="py-2"
                >
                  <LottieSuccessAnimation
                    amount={amount}
                    orderId={orderId}
                    utr={utrNumber}
                    title="Payment Confirmed!"
                    subtitle={`₹${amount} has been successfully credited to your wallet balance.`}
                    onDone={onClose}
                  />
                </motion.div>
              ) : (
                /* PAYMENT CARD */
                <>
                  <div className="rounded-3xl bg-[#130d29] border border-[#8b5cf6]/25 p-4.5 text-center space-y-3.5 shadow-inner relative">
                    {/* Zero Fee Pill Badge */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201344] border border-[#8b5cf6]/40">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-bold text-[#d8b4fe] tracking-wide">
                          Exact Amount • 0% Extra Charge
                        </span>
                      </div>
                    </div>

                    {/* Hero Price Display */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-4xl font-black text-[#c084fc] tracking-tight drop-shadow-[0_0_20px_rgba(192,132,252,0.5)] font-mono">
                          {formatCurrency(amount)}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(amount.toString());
                            setActiveAppToast(`Copied ₹${amount}!`);
                            setTimeout(() => setActiveAppToast(null), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Exact Amount"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11.5px] text-emerald-300/90 font-medium">
                        ₹{amount} will be directly credited to your wallet
                      </p>
                    </div>

                    {/* HIGH RESOLUTION QR CODE WITH AUTHENTIC UPI CENTER BADGE */}
                    <div className="flex justify-center my-1">
                      <div
                        ref={qrRef}
                        className="p-3.5 bg-white rounded-2xl shadow-xl relative inline-block border-2 border-white"
                      >
                        <QRCodeSVG
                          value={qrUpiIntent}
                          size={195}
                          level="H"
                          includeMargin={false}
                        />
                        
                        {/* Centered Authentic UPI Logo Emblem */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="px-2 py-0.5 bg-white rounded-full border border-gray-200 shadow-md flex items-center gap-0.5 scale-95">
                            <span className="text-[11px] font-black italic tracking-tighter text-[#1e1b4b]">
                              UPI
                            </span>
                            <div className="flex items-center -space-x-0.5">
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                                <polygon points="4,2 14,12 4,22" fill="#097939" />
                                <polygon points="12,2 22,12 12,22" fill="#ed752e" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TRANSACTION ID BAR */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#090514] border border-white/10 text-xs">
                      <span className="text-[11px] text-gray-400 font-medium">
                        Order Ref
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-gray-200">
                        <span>{orderId}</span>
                        <button
                          onClick={handleCopyTxn}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* DOWNLOAD QR CODE ACTION BUTTON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveQrToGallery}
                      disabled={isSavingQr}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/15 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>{isSavingQr ? 'Downloading...' : 'Save QR to Gallery'}</span>
                    </motion.button>
                  </div>

                  {/* PAY USING ANY UPI APP SECTION */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-semibold text-gray-400 block text-center">
                      Tap to pay directly with UPI App
                    </span>

                    <div className="grid grid-cols-5 gap-2">
                      {/* Google Pay */}
                      <button
                        onClick={() => handleAppClick('Google Pay', `tez://upi/pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchantName)}&tr=${orderId}&am=${amount}&cu=INR`)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform p-2">
                          <svg viewBox="0 0 24 24" className="w-7 h-7">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="none" />
                            <path d="M17.5 12c0-.52-.05-1.03-.13-1.52H12v2.88h3.08c-.13.71-.53 1.31-1.13 1.71v1.42h1.83c1.07-.99 1.72-2.44 1.72-4.49z" fill="#4285F4" />
                            <path d="M12 17.5c1.51 0 2.77-.5 3.7-1.36l-1.83-1.42c-.5.34-1.14.54-1.87.54-1.44 0-2.66-.97-3.1-2.28H6.99v1.46C7.94 16.32 9.8 17.5 12 17.5z" fill="#34A853" />
                            <path d="M8.9 12.98c-.11-.34-.18-.7-.18-1.08s.07-.74.18-1.08V9.36H6.99C6.62 10.15 6.4 11.05 6.4 12s.22 1.85.59 2.64l1.91-1.66z" fill="#FBBC05" />
                            <path d="M12 6.4c.82 0 1.56.28 2.14.84l1.6-1.6C14.77 4.72 13.51 4.2 12 4.2c-2.2 0-4.06 1.18-5.01 2.89l1.91 1.48c.44-1.31 1.66-2.27 3.1-2.27z" fill="#EA4335" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          Google Pay
                        </span>
                      </button>

                      {/* PhonePe */}
                      <button
                        onClick={() => handleAppClick('PhonePe', `phonepe://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchantName)}&tr=${orderId}&am=${amount}&cu=INR`)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#5f259f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <span className="text-xl font-bold text-white font-sans">पे</span>
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          PhonePe
                        </span>
                      </button>

                      {/* Paytm */}
                      <button
                        onClick={() => handleAppClick('Paytm', `paytmmp://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchantName)}&tr=${orderId}&am=${amount}&cu=INR`)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform px-1">
                          <span className="text-[10.5px] font-black text-[#002e6e] tracking-tighter leading-none">
                            pay<span className="text-[#00baf2]">tm</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          Paytm
                        </span>
                      </button>

                      {/* BHIM */}
                      <button
                        onClick={() => handleAppClick('BHIM', qrUpiIntent)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform p-1.5">
                          <div className="w-7 h-7 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-full h-full">
                              <polygon points="4,2 14,12 4,22" fill="#097939" />
                              <polygon points="12,2 22,12 12,22" fill="#ed752e" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          BHIM
                        </span>
                      </button>

                      {/* Others */}
                      <button
                        onClick={() => handleAppClick('UPI App', qrUpiIntent)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#1e1738] border border-white/10 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-gray-300">
                          <MoreHorizontal className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          Others
                        </span>
                      </button>
                    </div>

                    {/* Toast feedback when opening UPI App */}
                    {activeAppToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-[10.5px] font-bold text-[#c084fc] bg-[#7c3aed]/20 border border-[#7c3aed]/40 py-1 rounded-lg"
                      >
                        {activeAppToast}
                      </motion.div>
                    )}
                  </div>

                  {/* HOW TO PAY 3-STEP TIMELINE CARD */}
                  <div className="rounded-2xl bg-[#130d29] border border-[#8b5cf6]/20 p-3 text-center space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-300 block">
                      Automatic 3-Step Flow
                    </span>

                    <div className="flex items-center justify-between px-1">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center gap-1 w-20">
                        <div className="w-9 h-9 rounded-xl bg-[#1f1540] border border-[#8b5cf6]/30 flex items-center justify-center text-[#c084fc]">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <span className="text-[9.5px] text-gray-300 font-medium leading-tight text-center">
                          1. Open UPI App
                        </span>
                      </div>

                      <span className="text-gray-500 font-bold text-xs">→</span>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center gap-1 w-20">
                        <div className="w-9 h-9 rounded-xl bg-[#1f1540] border border-[#8b5cf6]/30 flex items-center justify-center text-[#c084fc]">
                          <Scan className="w-4 h-4" />
                        </div>
                        <span className="text-[9.5px] text-gray-300 font-medium leading-tight text-center">
                          2. Scan &amp; Pay
                        </span>
                      </div>

                      <span className="text-gray-500 font-bold text-xs">→</span>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center gap-1 w-20">
                        <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Zap className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-[9.5px] text-emerald-300 font-semibold leading-tight text-center">
                          3. Auto-Credit!
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AUTO-DETECTION REAL-TIME STATUS OR PAYMENT FAILED/EXPIRED STATE */}
                  {paymentFailedState ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2b0c16] via-[#200812] to-[#15040a] border border-rose-500/50 space-y-2.5 relative overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                          </div>
                          <span className="text-xs font-black tracking-wide text-rose-300 uppercase">
                            {paymentFailedState.status === 'EXPIRED' ? 'Order Expired' : 'Payment Failed'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
                          {paymentFailedState.status}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/50 border border-rose-500/20 space-y-1">
                        <p className="text-xs text-rose-200 font-semibold leading-snug">
                          {paymentFailedState.message}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {paymentFailedState.status === 'EXPIRED'
                            ? 'The UPI payment session for this order has timed out. Please close and re-open to generate a new QR.'
                            : 'The payment was declined or could not be completed by your bank.'}
                        </p>
                      </div>

                      <div className="pt-0.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentFailedState(null);
                            setVerifyError(null);
                            onClose();
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Close &amp; Retry</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleInstantAutoCheck}
                          disabled={isManualChecking}
                          className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer transition-all border border-white/10"
                        >
                          Re-check
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#130d29] to-[#1c113b] border border-[#8b5cf6]/35 space-y-2.5 relative overflow-hidden">
                      {/* Live Background Glow Pulse */}
                      <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#8b5cf6]/15 rounded-full blur-2xl pointer-events-none animate-pulse" />

                      {/* Waiting For Payment Header with Animated Radar Pulse */}
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex items-center justify-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#00e5ff] animate-ping absolute opacity-75" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] relative" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-cyan-200 to-purple-300">
                              Waiting for payment...
                            </span>
                            <span className="text-[9.5px] text-gray-400 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              Live sync active (poll #{pollingTick})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 border border-white/10 font-mono text-[10px] text-cyan-300">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{formatTimer(secondsRemaining)}</span>
                        </div>
                      </div>

                      {/* Dynamic Real-Time Status Notification Card */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2 relative z-10">
                        <Loader2 className="w-4 h-4 text-[#00e5ff] animate-spin shrink-0 mt-0.5" />
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] text-gray-200 font-medium leading-tight">
                            {statusMessage}
                          </p>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            Pay ₹{amount} via any UPI app. System checks bank confirmation automatically every 2.5s.
                          </p>
                        </div>
                      </div>

                      {verifyError && (
                        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 flex items-start gap-2 relative z-10">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{verifyError}</span>
                        </div>
                      )}

                      <div className="space-y-2 relative z-10">
                        <button
                          type="button"
                          onClick={handleInstantAutoCheck}
                          disabled={isManualChecking}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#9333ea] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#a855f7]/40"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-white ${isManualChecking ? 'animate-spin' : ''}`} />
                          <span>{isManualChecking ? 'Detecting Payment Transfer...' : 'I Have Paid • Auto-Check'}</span>
                        </button>

                        {/* Manual UTR Input Option (Admin Controlled) */}
                        {storeSettings?.enableUtrInput !== false && (
                          <form onSubmit={handleVerifyUtr} className="pt-1.5 border-t border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-[10.5px] text-gray-400">
                              <span>Paid with UPI? Enter 12-digit UTR:</span>
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                maxLength={22}
                                placeholder="Enter 12-digit UTR / Ref No"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#c084fc] text-xs font-mono text-white placeholder:text-gray-500 outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isUtrVerifying || !utrNumber.trim()}
                                className="px-3.5 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#00b4d8] text-[#0a0a0f] disabled:opacity-40 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                              >
                                {isUtrVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                <span>Submit UTR</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FOOTER ENCRYPTED BADGE */}
                  <div className="pt-1 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>100% Secure &amp; Direct Bank UPI Settlement</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
