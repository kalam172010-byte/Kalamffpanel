import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Share2,
  X,
  ShieldCheck,
  Key,
  CheckCircle2,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PurchaseInvoice, StoreSettings } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { StoreLogo } from '../shared/store-logo';

interface KeyInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PurchaseInvoice | null;
  storeSettings?: StoreSettings;
  onGoToMyKeys?: () => void;
}

export const KeyInvoiceModal: React.FC<KeyInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  storeSettings,
  onGoToMyKeys,
}) => {
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedKeyIdx, setCopiedKeyIdx] = useState<number | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handleCopyKey = (k: string, idx: number) => {
    navigator.clipboard.writeText(k);
    setCopiedKeyIdx(idx);
    setTimeout(() => setCopiedKeyIdx(null), 2000);
  };

  const handleCopyFullInvoice = () => {
    const text = `🧾 ===============================
${invoice.shopName.toUpperCase()} - DIGITAL RECEIPT
===============================
Invoice No: ${invoice.invoiceNumber}
Order ID: ${invoice.orderId}
Date: ${invoice.date}
Customer: ${invoice.buyerName} (@${invoice.buyerUsername || 'customer'})
Status: ${invoice.status} (PAID VIA ${invoice.paymentMethod.toUpperCase()})
-------------------------------
ITEM DETAILS:
Product: ${invoice.productName}
Plan: ${invoice.planDuration}
Qty: ${invoice.quantity}
Unit Price: ₹${invoice.unitPrice.toFixed(2)}
Total Paid: ₹${invoice.totalAmount.toFixed(2)}
-------------------------------
LICENSE KEYS DELIVERED (${invoice.keys.length}):
${invoice.keys.map((k, i) => `${i + 1}. ${k}`).join('\n')}
-------------------------------
Support: ${invoice.supportContact || '@Kalam_Mods_Official'}
Thank you for your business!
===============================`;

    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const element = document.createElement('a');
    const text = `=====================================================
${invoice.shopName.toUpperCase()} OFFICIAL INVOICE & LICENSE RECEIPT
=====================================================
Invoice Number : ${invoice.invoiceNumber}
Order ID       : ${invoice.orderId}
Date & Time    : ${invoice.date}
Status         : ${invoice.status} - VERIFIED PAYMENT
Payment Method : ${invoice.paymentMethod}

CUSTOMER DETAILS:
Name           : ${invoice.buyerName}
Username       : @${invoice.buyerUsername || 'customer'}
Email          : ${invoice.buyerEmail || 'N/A'}

PURCHASE SUMMARY:
Product        : ${invoice.productName}
Category       : ${invoice.category || 'Digital License'}
Platform       : ${invoice.deviceType || 'Multi-platform'}
Plan Duration  : ${invoice.planDuration}
Quantity       : ${invoice.quantity}
Unit Price     : ₹${invoice.unitPrice.toFixed(2)}
Total Amount   : ₹${invoice.totalAmount.toFixed(2)}

DELIVERED LICENSE KEYS:
${invoice.keys.map((k, i) => `[KEY #${i + 1}] ${k}`).join('\n')}

SUPPORT & INSTRUCTIONS:
Telegram: ${invoice.supportContact || storeSettings?.supportUsername || 'https://t.me/Kalam_Mods_Official'}
Please save this invoice for warranty and support purposes.
=====================================================`;

    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${invoice.invoiceNumber}_Receipt.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Invoice Modal Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-50 w-full max-w-lg bg-[#11111b] border border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] text-white space-y-4 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Top Actions Bar (Print, Download, Copy, Close) */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Official Purchase Invoice</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    GENERATED
                  </span>
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  #{invoice.invoiceNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyFullInvoice}
                title="Copy full text receipt"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 cursor-pointer transition-all"
              >
                {copiedInvoice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadText}
                title="Download Receipt .txt"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-cyan-400 border border-white/10 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable / Viewable Invoice Content */}
          <div
            ref={invoiceRef}
            className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar text-xs"
          >
            {/* Header: Store Name + Status Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161628] to-[#12121f] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StoreLogo
                  logoUrl={storeSettings?.logoUrl}
                  alt={invoice.shopName}
                  className="w-10 h-10 rounded-xl"
                />
                <div>
                  <h4 className="text-sm font-black text-white tracking-wide">
                    {invoice.shopName}
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-medium block">
                    Instant Digital Key Delivery System
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PAID &amp; DELIVERED</span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1 font-mono">
                  {invoice.date}
                </span>
              </div>
            </div>

            {/* Metadata Grid (Invoice No, Order ID, Customer, Payment) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  Invoice &amp; Order
                </span>
                <div className="font-mono text-[11px] text-cyan-300 font-bold">
                  {invoice.invoiceNumber}
                </div>
                <div className="font-mono text-[10px] text-gray-400 truncate">
                  Ref: {invoice.orderId}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  Billed To
                </span>
                <div className="text-[11px] font-bold text-white truncate">
                  {invoice.buyerName}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  @{invoice.buyerUsername || 'customer'} • {invoice.paymentMethod}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-2xl border border-white/10 bg-black/60 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-[10px] font-extrabold text-gray-300 uppercase tracking-wider">
                <span>Description</span>
                <span>Amount</span>
              </div>

              <div className="p-3.5 space-y-2 border-b border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-white block">
                      {invoice.productName}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span className="text-cyan-400 font-mono font-bold">
                        {invoice.planDuration}
                      </span>
                      {invoice.deviceType && (
                        <>
                          <span>•</span>
                          <span>{invoice.deviceType}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Qty: {invoice.quantity}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0">
                    ₹{(invoice.unitPrice * invoice.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total Calculation Row */}
              <div className="p-3.5 bg-white/[0.02] space-y-1.5">
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Delivery Fee:</span>
                  <span className="font-mono text-emerald-400">FREE (Instant API)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-white pt-1.5 border-t border-white/10">
                  <span className="text-cyan-300 uppercase">Total Paid:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivered Keys Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Delivered License Key ({invoice.keys.length})</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">
                  Instant Activation Ready
                </span>
              </div>

              <div className="space-y-2">
                {invoice.keys.map((k, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#090910] border border-cyan-500/40 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 uppercase font-mono block">
                        KEY #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-black text-[#00e5ff] tracking-wide select-all truncate block">
                        {k}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyKey(k, idx)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all"
                    >
                      {copiedKeyIdx === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Guarantee & Warranty Note */}
            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-[11px] text-gray-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This invoice serves as your verified proof of purchase. All keys are verified
                authentic and stored securely in your <strong className="text-white">My Keys Storage</strong>.
              </p>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-colors text-center"
            >
              Done / Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onGoToMyKeys) onGoToMyKeys();
              }}
              className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Go to My Keys</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
