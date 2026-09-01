import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Wallet,
  ShoppingCart,
  Key,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Gift,
  Share2,
  Clock,
  ExternalLink,
  Play,
  HelpCircle,
  Sparkles,
  AlertCircle,
  Loader2,
  Smartphone,
  Zap,
  RefreshCw,
  CreditCard,
  Download,
  CloudDownload,
  Info,
  Lock,
  Scan,
  Grid,
  MoreHorizontal
} from 'lucide-react';
import { Product, PlanPricing, PurchasedKey, TransactionRecord, StoreSettings, PaymentGatewayConfig } from '../../types';
import { formatCurrency, getYouTubeEmbedUrl, isYouTubeUrl } from '../../lib/utils';
import { safeFetchJson } from '../../lib/safe-api';

/* ==================== HOW TO DEPOSIT MODAL ==================== */
interface HowToDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  minDeposit?: number;
}

export const HowToDepositModal: React.FC<HowToDepositModalProps> = ({
  isOpen,
  onClose,
  videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  minDeposit = 1,
}) => {
  const ytEmbedUrl = getYouTubeEmbedUrl(videoUrl);
  const isYouTube = isYouTubeUrl(videoUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative z-50 w-full ${isYouTube ? 'max-w-md' : 'max-w-sm'} bg-[#161622] border border-red-500/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(239,68,68,0.25)] text-white space-y-3.5 transition-all`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                  <Play className="w-4 h-4 fill-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-red-400 tracking-wider">
                    How To Deposit?
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {isYouTube ? '▶ Video Guide & Live Demo' : '1-Minute Quick Guide'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video preview / YouTube Player Box */}
            {ytEmbedUrl ? (
              <div className="relative rounded-2xl bg-black border border-red-500/30 overflow-hidden aspect-video shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <iframe
                  src={ytEmbedUrl}
                  title="How To Deposit Video Tutorial"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative rounded-2xl bg-black/60 border border-white/10 overflow-hidden aspect-video flex flex-col items-center justify-center p-4 text-center group">
                <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-0.5 fill-white" />
                </div>
                <span className="text-xs font-bold text-white mt-2">1-Minute Quick Deposit Guide</span>
                <span className="text-[10px] text-gray-400">Step-by-step instant UPI deposit & QR code scanning</span>
              </div>
            )}

            {/* Steps in English */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#00e5ff] font-bold">
                  <span className="w-4 h-4 rounded-full bg-[#00e5ff]/20 flex items-center justify-center text-[10px]">1</span>
                  <span>Enter Amount & Generate QR Code</span>
                </div>
                <p className="text-gray-300 text-[11px] pl-6">
                  Specify your deposit amount (minimum ₹{minDeposit}) and click "Generate FreePanel UPI QR".
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#8b5cf6] font-bold">
                  <span className="w-4 h-4 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-[10px]">2</span>
                  <span>Scan & Pay with Any UPI App</span>
                </div>
                <p className="text-gray-300 text-[11px] pl-6">
                  Complete the payment via Google Pay, PhonePe, Paytm, CRED, or BHIM. Funds will credit to your wallet in 5 seconds.
                </p>
              </div>
            </div>

            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              <span>{isYouTube ? 'Open in YouTube' : 'Watch Video Tutorial'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ==================== DEPOSIT MODAL ==================== */
interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number) => void;
  storeSettings: StoreSettings;
  paymentConfigs?: PaymentGatewayConfig[];
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDepositSuccess,
  storeSettings,
  paymentConfigs = [],
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [step, setStep] = useState<'AMOUNT' | 'GENERATING' | 'QR' | 'SUCCESS'>('AMOUNT');
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [autoCheckStatus, setAutoCheckStatus] = useState<string>('Listening for bank UPI transfer...');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isSavingQr, setIsSavingQr] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amountInPaise: number;
    amountInRupees: number;
    paymentUrl: string;
    upiIntent: string;
    qrUrl?: string;
    payeeUpi?: string;
  } | null>(null);

  const predefinedAmounts = [1, 10, 50, 100, 250, 500];

  // Active payment gateway config
  const activeGateway = paymentConfigs.find((c) => c.isActive) || paymentConfigs.find((c) => c.id === 'fampay-gw') || paymentConfigs[0];

  // Countdown timer from 05:00
  React.useEffect(() => {
    if (!isOpen || step !== 'QR') {
      setSecondsRemaining(300);
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        canvas.width = 400;
        canvas.height = 400;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20, 360, 360);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `UPI-QR-${orderData?.orderId || 'DEPOSIT'}.png`;
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

  // Real-time Auto-polling effect for bank UPI payment verification
  React.useEffect(() => {
    let interval: any = null;
    let isCancelled = false;

    if (isOpen && step === 'QR' && orderData?.orderId) {
      setIsAutoChecking(true);
      setAutoCheckStatus('Listening for bank UPI transfer • Auto-detecting...');

      const checkStatus = async () => {
        try {
          const apiKeyParam = activeGateway?.apiKey ? `?apiKey=${encodeURIComponent(activeGateway.apiKey)}` : '';
          const res = await fetch(`/api/check-payment/${orderData.orderId}${apiKeyParam}`);
          const data = await res.json();

          if (isCancelled) return;

          // STRICT CHECK: Only credit when server actually confirms real bank receipt
          if (data?.isPaid === true && data?.status === 'SUCCESS') {
            setAutoCheckStatus('Payment confirmed! Crediting wallet...');
            setIsAutoChecking(false);
            setVerifyError(null);
            if (interval) clearInterval(interval);

            // Trigger real bank credited amount
            const creditedAmount = data.amount || orderData.amountInRupees || amount;
            setTimeout(() => {
              if (!isCancelled) {
                onDepositSuccess(creditedAmount);
                setStep('SUCCESS');
                setTimeout(() => {
                  if (!isCancelled) {
                    setStep('AMOUNT');
                    setOrderData(null);
                    setVerifyError(null);
                    onClose();
                  }
                }, 2200);
              }
            }, 500);
          } else if (data?.message) {
            setAutoCheckStatus(data.message);
          }
        } catch (err) {
          console.warn('Auto check status error:', err);
        }
      };

      // Initial check
      checkStatus();
      // Poll every 2.5 seconds
      interval = setInterval(checkStatus, 2500);
    }

    return () => {
      isCancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [isOpen, step, orderData?.orderId, activeGateway?.apiKey]);

  const handleGenerateQR = async () => {
    if (amount < (storeSettings.minDeposit || 1)) return;

    setStep('GENERATING');
    setVerifyError(null);
    try {
      const response = await safeFetchJson<any>('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount, // will be converted to paise in server
          redirect_url: window.location.origin + '/success',
          apiKey: activeGateway?.apiKey,
          gatewayUrl: activeGateway?.baseUrl || (activeGateway as any)?.gatewayUrl,
          merchantUpi: activeGateway?.merchantUpi || '8056317218@fam',
        }),
      });

      const resJson = response.data;
      if (resJson?.order) {
        const orderId = resJson.order.orderId || `FAMPAY_${Date.now()}`;
        const upiId = resJson.order.payeeUpi || activeGateway?.merchantUpi || '8056317218@fam';
        const exactUpiLink = `upi://pay?pa=${upiId}&pn=Kalam%20FF%20Store&tr=${orderId}&am=${amount}&cu=INR`;

        setOrderData({
          ...resJson.order,
          orderId,
          amountInPaise: amount * 100,
          amountInRupees: amount, // Strictly locked to exact deposit amount
          paymentUrl: exactUpiLink,
          upiIntent: exactUpiLink,
          payeeUpi: upiId,
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(exactUpiLink)}`,
        });
      } else {
        const orderId = `FAMPAY_${Date.now()}`;
        const upiId = activeGateway?.merchantUpi || '8056317218@fam';
        const upiLink = `upi://pay?pa=${upiId}&pn=Kalam%20FF%20Store&tr=${orderId}&am=${amount}&cu=INR`;
        setOrderData({
          orderId,
          amountInPaise: amount * 100,
          amountInRupees: amount,
          paymentUrl: upiLink,
          upiIntent: upiLink,
          payeeUpi: upiId,
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`,
        });
      }
      setStep('QR');
    } catch (err) {
      console.warn('Fallback local order generation', err);
      const orderId = `FAMPAY_${Date.now()}`;
      const upiId = activeGateway?.merchantUpi || '8056317218@fam';
      const upiLink = `upi://pay?pa=${upiId}&pn=Kalam%20FF%20Store&tr=${orderId}&am=${amount}&cu=INR`;
      setOrderData({
        orderId,
        amountInPaise: amount * 100,
        amountInRupees: amount,
        paymentUrl: upiLink,
        upiIntent: upiLink,
        payeeUpi: upiId,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`,
      });
      setStep('QR');
    }
  };

  const handleInstantAutoCheck = async () => {
    if (!orderData?.orderId || isManualChecking) return;
    setIsManualChecking(true);
    setVerifyError(null);
    setAutoCheckStatus('Checking bank gateway for payment transfer...');

    try {
      const res = await safeFetchJson<any>('/api/auto-detect-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          amount: orderData.amountInRupees || amount,
          apiKey: activeGateway?.apiKey,
        }),
      });

      const data = res.data;
      if (data?.isPaid === true && data?.status === 'SUCCESS') {
        const creditedAmount = data.amount || orderData.amountInRupees || amount;
        onDepositSuccess(creditedAmount);
        setStep('SUCCESS');
        setTimeout(() => {
          setStep('AMOUNT');
          setOrderData(null);
          setVerifyError(null);
          onClose();
        }, 2200);
      } else {
        setAutoCheckStatus('Payment pending: Complete UPI payment in your app to auto-credit.');
      }
    } catch (e) {
      console.warn(e);
      setAutoCheckStatus('Bank sync active: Auto-detecting...');
    } finally {
      setIsManualChecking(false);
    }
  };

  const activeUpiId = orderData?.payeeUpi || '8056317218@fam';

  const copyOrderId = () => {
    if (orderData?.orderId) {
      navigator.clipboard.writeText(orderData.orderId);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const copyPayAmount = () => {
    const amtToCopy = (orderData?.amountInRupees || amount).toString();
    navigator.clipboard.writeText(amtToCopy);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Construct the scannable UPI string for any UPI app
  const qrUpiString =
    orderData?.upiIntent ||
    `upi://pay?pa=${activeUpiId}&pn=FamPay&tr=${orderData?.orderId || 'FAMPAY'}&am=${orderData?.amountInRupees || amount}&cu=INR`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            className={`relative z-50 w-full max-h-[92vh] overflow-y-auto ${
              step === 'QR'
                ? 'max-w-[390px] rounded-[32px] bg-[#0c0919] border border-[#7c3aed]/25 p-5 shadow-[0_0_60px_rgba(124,58,237,0.25)]'
                : 'max-w-sm bg-[#161622] border border-[#00e5ff]/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,229,255,0.25)]'
            } text-white`}
          >
            <div className={step === 'QR' ? 'space-y-4' : 'space-y-4'}>
              {/* Header for AMOUNT or GENERATING */}
              {step !== 'QR' ? (
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Deposit Wallet Cash</h3>
                      <span className="text-[10px] text-gray-400">Instant UPI Gateway</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null}

              {step === 'AMOUNT' && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Enter Deposit Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#ff0080]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] focus:outline-none text-xl font-bold text-white tracking-wide"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                      <span>Minimum: ₹{storeSettings.minDeposit || 1} (0% Gateway Fee)</span>
                      <span className="font-mono text-cyan-400">100% Wallet Credit (₹{amount} = ₹{amount})</span>
                    </div>
                  </div>

                  {/* 0% Fee Guarantee Pill */}
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2 text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-semibold">
                      <strong className="text-emerald-400">0% Extra Fees:</strong> Adding ₹{amount} gives exactly ₹{amount} in your wallet balance!
                    </span>
                  </div>

                  {/* Predefined Amounts */}
                  <div className="grid grid-cols-3 gap-2">
                    {predefinedAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                          amount === amt
                            ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]'
                            : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        + ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Exact 1:1 Deposit Guarantee Banner */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-cyan-300">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px]">
                      Exact 1:1 Direct Credit • Depositing ₹{amount} adds exactly <strong className="text-cyan-200 font-mono">₹{amount}</strong> to your wallet balance.
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateQR}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-sm shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Proceed to Secure Payment</span>
                  </motion.button>
                </div>
              )}

              {step === 'GENERATING' && (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
                  <h4 className="text-sm font-bold text-white">Generating UPI QR Code...</h4>
                  <p className="text-[11px] text-gray-400">
                    Creating secure order for ₹{amount}...
                  </p>
                </div>
              )}

              {step === 'QR' && (
                <div className="space-y-4">
                  {/* TOP APP BAR */}
                  <div className="flex items-center justify-between pb-1">
                    <button
                      onClick={() => setStep('AMOUNT')}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer transition-colors"
                      title="Back"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="text-center">
                      <h2 className="text-base font-black text-white tracking-wide">
                        Secure Payment
                      </h2>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 font-medium">
                        <span>Fast</span>
                        <span>•</span>
                        <span>Secure</span>
                        <span>•</span>
                        <span>Trusted</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#a855f7]" />
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c084fc] shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>

                  {/* MAIN PAYMENT CARD */}
                  <div className="rounded-3xl bg-[#130d29] border border-[#8b5cf6]/25 p-4.5 text-center space-y-3.5 shadow-inner relative">
                    {/* Amount to Pay Pill Badge & Zero Extra Charge Guarantee */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201344] border border-[#8b5cf6]/40">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] font-bold text-[#d8b4fe] tracking-wide">
                          Exact Amount • 0% Fee
                        </span>
                      </div>
                    </div>

                    {/* Hero Price Display */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-4xl font-black text-[#c084fc] tracking-tight drop-shadow-[0_0_20px_rgba(192,132,252,0.5)] font-mono">
                          {formatCurrency(orderData?.amountInRupees || amount)}
                        </div>
                        <button
                          onClick={copyPayAmount}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Exact Amount"
                        >
                          {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11.5px] text-emerald-300/90 font-medium">
                        ₹{orderData?.amountInRupees || amount} will be added 100% to your wallet
                      </p>
                    </div>

                    {/* HIGH RESOLUTION QR CODE WITH AUTHENTIC UPI CENTER BADGE */}
                    <div className="flex justify-center my-1">
                      <div
                        ref={qrRef}
                        className="p-3.5 bg-white rounded-2xl shadow-xl relative inline-block border-2 border-white"
                      >
                        <QRCodeSVG
                          value={qrUpiString}
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
                        Transaction ID
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-gray-200">
                        <span>{orderData?.orderId || 'TXN9F7K2L8'}</span>
                        <button
                          onClick={copyOrderId}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                          title="Copy Transaction ID"
                        >
                          {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* DOWNLOAD QR CODE ACTION BUTTON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveQrToGallery}
                      disabled={isSavingQr}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#9333ea] text-white font-extrabold text-xs shadow-[0_0_25px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#a855f7]/40 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>{isSavingQr ? 'Downloading...' : 'Download QR Code'}</span>
                    </motion.button>
                  </div>

                  {/* PAY USING ANY UPI APP SECTION */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-semibold text-gray-400 block text-center">
                      Tap to pay directly with UPI App
                    </span>

                    <div className="grid grid-cols-5 gap-2">
                      {/* Google Pay */}
                      <a
                        href={`tez://upi/pay?pa=${activeUpiId}&pn=Kalam%20FF%20Store&tr=${orderData?.orderId || 'FAMPAY'}&am=${orderData?.amountInRupees || amount}&cu=INR`}
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
                      </a>

                      {/* PhonePe */}
                      <a
                        href={`phonepe://pay?pa=${activeUpiId}&pn=Kalam%20FF%20Store&tr=${orderData?.orderId || 'FAMPAY'}&am=${orderData?.amountInRupees || amount}&cu=INR`}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#5f259f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <span className="text-xl font-bold text-white font-sans">पे</span>
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          PhonePe
                        </span>
                      </a>

                      {/* Paytm */}
                      <a
                        href={`paytmmp://pay?pa=${activeUpiId}&pn=Kalam%20FF%20Store&tr=${orderData?.orderId || 'FAMPAY'}&am=${orderData?.amountInRupees || amount}&cu=INR`}
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
                      </a>

                      {/* BHIM */}
                      <a
                        href={qrUpiString}
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
                      </a>

                      {/* Others */}
                      <a
                        href={qrUpiString}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#1e1738] border border-white/10 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-gray-300">
                          <MoreHorizontal className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium tracking-tight">
                          Others
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* AUTO-DETECTION REAL-TIME STATUS & MANUAL SYNC BUTTON */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#130d29] to-[#1c113b] border border-[#8b5cf6]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-400">
                          Auto-Detect Engine Active
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formatTimer(secondsRemaining)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                      {autoCheckStatus}
                    </p>

                    {verifyError && (
                      <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    <div className="pt-0.5">
                      <button
                        onClick={handleInstantAutoCheck}
                        disabled={isManualChecking}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_15px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isManualChecking ? 'animate-spin' : ''}`} />
                        <span>{isManualChecking ? 'Detecting Bank Transfer...' : 'Auto-Check & Verify Payment'}</span>
                      </button>
                    </div>
                  </div>

                  {/* FOOTER ENCRYPTED BADGE */}
                  <div className="space-y-1 pt-0.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>100% Secure UPI Settlement • 0% Extra Charges</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 'SUCCESS' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-6 text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Deposit Successful!</h4>
                    <p className="text-xs text-gray-300 mt-1">
                      {formatCurrency(orderData?.amountInRupees || amount)} has been credited instantly to your wallet balance.
                    </p>
                    {orderData && (
                      <span className="text-[10px] text-gray-400 font-mono block mt-2">
                        Ref: {orderData.orderId}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ==================== BUY KEYS MODAL / CATALOG ==================== */
interface BuyKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  balance: number;
  onPurchaseKey: (product: Product, plan: PlanPricing) => void;
  onOpenDeposit: () => void;
}

export const BuyKeysModal: React.FC<BuyKeysModalProps> = ({
  isOpen,
  onClose,
  products,
  balance,
  onPurchaseKey,
  onOpenDeposit,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products[0] || null
  );
  const [selectedPlan, setSelectedPlan] = useState<PlanPricing | null>(
    products[0]?.plans[0] || null
  );

  useEffect(() => {
    if (!selectedProduct || !products.some((p) => p.id === selectedProduct.id)) {
      const nextProd = products[0] || null;
      setSelectedProduct(nextProd);
      setSelectedPlan(nextProd?.plans[0] || null);
    }
  }, [products, selectedProduct]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-50 w-full max-w-md max-h-[85vh] bg-[#161622] border border-[#ff0080]/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(255,0,128,0.25)] text-white space-y-4 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ff0080]/15 border border-[#ff0080]/30 flex items-center justify-center text-[#ff0080]">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Buy Digital Keys</h3>
                  <span className="text-[10px] text-gray-400">Instant Digital Key Delivery & Screen Activation</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-white/10">
              <span className="text-xs text-gray-400">Your Wallet Balance:</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#ff0080]">
                  {formatCurrency(balance)}
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="px-2 py-1 rounded-lg bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold border border-[#00e5ff]/40"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Product Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Select Product
              </label>
              <div className="grid grid-cols-2 gap-2">
                {products.map((prod) => {
                  const isSelected = selectedProduct?.id === prod.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedPlan(prod.plans[0] || null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-yellow-400 block uppercase">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">{prod.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                        ● {prod.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Selector */}
            {selectedProduct && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Select Plan Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.plans.map((p) => {
                    const isSelected = selectedPlan?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff0080]/20 border-[#ff0080] shadow-[0_0_15px_rgba(255,0,128,0.3)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{p.duration}</span>
                        <span className="text-xs font-extrabold text-[#ff0080]">₹{p.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Purchase CTA */}
            {selectedProduct && selectedPlan && (
              <div className="pt-2">
                {balance >= selectedPlan.price ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onPurchaseKey(selectedProduct, selectedPlan);
                      onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white font-extrabold text-xs shadow-[0_0_25px_rgba(255,0,128,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Purchase Key for ₹{selectedPlan.price}</span>
                  </motion.button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Insufficient wallet balance. Please add cash to purchase.</span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDeposit();
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#00e5ff] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
                    >
                      Deposit ₹{selectedPlan.price - balance} to continue
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { KeyPurchaseModal } from './key-purchase-modal';
export type { KeyPurchaseModalData, PurchaseStage } from './key-purchase-modal';
