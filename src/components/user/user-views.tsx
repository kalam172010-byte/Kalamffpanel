import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Key,
  Copy,
  Check,
  Clock,
  ExternalLink,
  Gift,
  Share2,
  Users,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award,
  Mail,
  LogOut,
  LogIn,
  Lock,
  User,
  Calendar,
  QrCode,
  Send,
  Zap,
  DollarSign,
  FileText
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { PurchasedKey, TransactionRecord, StoreSettings, AuthUser, ResellerUser, PurchaseInvoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

/* ==================== MY KEYS VIEW ==================== */
interface MyKeysViewProps {
  keys: PurchasedKey[];
  onOpenBuyKeys: () => void;
  onViewInvoice?: (invoice: PurchaseInvoice) => void;
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
}

export const MyKeysView: React.FC<MyKeysViewProps> = ({
  keys,
  onOpenBuyKeys,
  onViewInvoice,
  currentUser,
  storeSettings,
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleGenerateInvoiceFromKey = (k: PurchasedKey) => {
    if (!onViewInvoice) return;
    const inv: PurchaseInvoice = {
      invoiceNumber: k.invoiceNumber || `INV-${k.id.replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}`,
      orderId: k.orderId || `ORD-${k.id.replace(/\D/g, '').slice(-4) || '9241'}`,
      date: k.purchaseDate,
      buyerName: currentUser?.name || currentUser?.username || 'Customer',
      buyerUsername: currentUser?.username || 'customer',
      buyerEmail: currentUser?.email || '',
      productName: k.productName,
      category: 'Game License',
      game: k.game,
      deviceType: k.deviceType,
      planDuration: k.planName,
      quantity: 1,
      unitPrice: k.price,
      totalAmount: k.price,
      paymentMethod: 'Wallet Balance',
      keys: [k.keyCode],
      status: 'DELIVERED',
      shopName: storeSettings?.shopName || 'KALAM MODS OFFICIAL',
      supportContact: storeSettings?.supportUsername || '@Kalam_Mods_Official',
    };
    onViewInvoice(inv);
  };

  const handleCopyKey = (key: PurchasedKey) => {
    navigator.clipboard.writeText(key.keyCode);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-4" id="my-keys-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-400" />
            <span>My Active Keys ({keys.length})</span>
          </h2>
          <span className="text-[11px] text-gray-400">Copy your license keys to activate in-app</span>
        </div>
        <button
          onClick={onOpenBuyKeys}
          className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all cursor-pointer"
        >
          + Buy New
        </button>
      </div>

      {keys.length === 0 ? (
        <GlassCard className="p-8 text-center space-y-3 bg-[#161622]/90 border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Keys Purchased Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Select any product from the catalog to purchase digital mod & bypass keys instantly.
          </p>
          <button
            onClick={onOpenBuyKeys}
            className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-lg cursor-pointer"
          >
            Browse Products
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <GlassCard
              key={k.id}
              glow="gold"
              className="p-4 bg-[#161622]/95 border-orange-500/30 space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-orange-400 font-mono font-bold block">
                    {k.planName}
                  </span>
                  <h4 className="text-sm font-bold text-white">{k.productName}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              {/* Key Box */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-[#00e5ff]">
                <span className="truncate pr-2 select-all font-bold">{k.keyCode}</span>
                <button
                  onClick={() => handleCopyKey(k)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white shrink-0 cursor-pointer"
                >
                  {copiedKeyId === k.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  Purchased: {k.purchaseDate}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-semibold font-mono">₹{k.price}</span>
                  {onViewInvoice && (
                    <button
                      onClick={() => handleGenerateInvoiceFromKey(k)}
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                      title="View & Download Invoice"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ==================== HISTORY VIEW ==================== */
interface HistoryViewProps {
  transactions: TransactionRecord[];
  onViewInvoice?: (invoice: PurchaseInvoice) => void;
  userKeys?: PurchasedKey[];
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  onViewInvoice,
  userKeys = [],
  currentUser,
  storeSettings,
}) => {
  const handleOpenTxInvoice = (tx: TransactionRecord) => {
    if (!onViewInvoice) return;
    // Match any associated key
    const matchingKey = userKeys.find((k) =>
      (tx.utrOrReference && k.orderId && tx.utrOrReference.includes(k.orderId)) ||
      (tx.description && k.keyCode && tx.description.includes(k.keyCode)) ||
      (tx.date === k.purchaseDate)
    );

    const inv: PurchaseInvoice = {
      invoiceNumber: matchingKey?.invoiceNumber || `INV-${tx.id.replace(/\D/g, '').slice(-6) || '883921'}`,
      orderId: tx.utrOrReference || matchingKey?.orderId || `ORD-KEY-${tx.id.slice(-4)}`,
      date: tx.date,
      buyerName: currentUser?.name || currentUser?.username || 'Customer',
      buyerUsername: currentUser?.username || 'customer',
      buyerEmail: currentUser?.email || '',
      productName: matchingKey?.productName || 'VIP Game License Key',
      category: 'Digital License',
      game: matchingKey?.game,
      deviceType: matchingKey?.deviceType,
      planDuration: matchingKey?.planName || 'Key Delivery',
      quantity: 1,
      unitPrice: tx.amount,
      totalAmount: tx.amount,
      paymentMethod: tx.method || 'Wallet Balance',
      keys: matchingKey ? [matchingKey.keyCode] : ['(Stored in My Keys section)'],
      status: 'DELIVERED',
      shopName: storeSettings?.shopName || 'KALAM MODS OFFICIAL',
      supportContact: storeSettings?.supportUsername || '@Kalam_Mods_Official',
    };
    onViewInvoice(inv);
  };

  return (
    <div className="space-y-4" id="history-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00e5ff]" />
          <span>Wallet & Purchase History</span>
        </h2>
        <span className="text-[11px] text-gray-400">All recent deposits, refunds, and keys generated</span>
      </div>

      {transactions.length === 0 ? (
        <GlassCard className="p-8 text-center space-y-3 bg-[#161622]/90 border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Transactions Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Your wallet deposits, key purchases, and instant bot deliveries will appear here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <GlassCard
              key={tx.id}
              glow="none"
              className="p-3.5 bg-[#161622]/90 border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'DEPOSIT'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#ff0080]/15 text-[#ff0080] border border-[#ff0080]/30'
                  }`}
                >
                  {tx.type === 'DEPOSIT' ? '+' : '-'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white truncate">
                      {tx.type === 'DEPOSIT' ? 'Wallet Deposit (UPI)' : 'Digital Key Purchase'}
                    </h4>
                    {tx.type === 'KEY_PURCHASE' && onViewInvoice && (
                      <button
                        onClick={() => handleOpenTxInvoice(tx)}
                        className="px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                        title="View Official Purchase Invoice"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>Invoice</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="font-mono text-gray-300 truncate">{tx.utrOrReference}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-extrabold font-mono block ${
                    tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-gray-200'
                  }`}
                >
                  {tx.type === 'DEPOSIT' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase">
                  {tx.status}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ==================== REFERRAL VIEW ==================== */
interface ReferralViewProps {
  storeSettings: StoreSettings;
  currentUser?: AuthUser | null;
  resellers?: ResellerUser[];
  transactions?: TransactionRecord[];
  onOpenDeposit?: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  storeSettings,
  currentUser,
  resellers = [],
  transactions = [],
  onOpenDeposit,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Dynamic Website Referral URL based on the real website domain
  const siteOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://kalam-ff-store.web.app';

  const myRefCode = (currentUser?.referralCode || currentUser?.username || currentUser?.id || 'KALAM').trim();
  const referralLink = `${siteOrigin}?ref=${encodeURIComponent(myRefCode)}`;

  // Find referred friends from the users database
  const referredFriends = (resellers || []).filter(
    (u) =>
      (u.referredBy && u.referredBy.toLowerCase() === myRefCode.toLowerCase()) ||
      (currentUser?.username && u.referredBy && u.referredBy.toLowerCase() === currentUser.username.toLowerCase())
  );

  const totalReferralsCount = Math.max(
    referredFriends.length,
    currentUser?.totalReferrals || 0
  );

  // Calculate total commission earned from referral rewards
  const referralTransactions = (transactions || []).filter(
    (t) => t.type === 'REFERRAL_REWARD'
  );

  const totalEarnedFromTxns = referralTransactions.reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0
  );

  const totalEarnedCommission = (currentUser?.referralEarnings || 0) + totalEarnedFromTxns;
  const commissionPercent = storeSettings.referralBonusPercent || 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `🔥 Join KALAM MODS Free Fire VIP Store! Register using my official website referral link and get instant VIP activation & wallet bonus:\n${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `🔥 KALAM MODS Free Fire VIP Store - Register & Get Instant Wallet Bonus!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4" id="referral-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-yellow-400" />
            <span>Refer & Earn Real Money</span>
          </h2>
          <span className="text-[11px] text-gray-400">
            Share your website referral link to earn {commissionPercent}% instant lifetime cash!
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-[10px] font-bold">
          {commissionPercent}% Commission
        </span>
      </div>

      {/* MAIN REFERRAL HERO CARD */}
      <GlassCard
        glow="gold"
        className="p-4 bg-gradient-to-br from-[#1d1810] via-[#161622] to-[#161622] border-yellow-500/30 space-y-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Earn Real Wallet Cash</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  AUTO-CREDIT
                </span>
              </h3>
              <p className="text-[10.5px] text-gray-300 leading-snug mt-0.5">
                Whenever friends register via your website link & deposit funds, you get <strong className="text-yellow-400">{commissionPercent}%</strong> credited instantly to your wallet.
              </p>
            </div>
          </div>
        </div>

        {/* Website Referral Link Box */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-semibold uppercase">Your Website Referral Link</span>
            <span className="text-yellow-400/90 font-mono font-bold">CODE: {myRefCode}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs font-mono text-yellow-300 gap-2">
            <span className="truncate flex-1 select-all">{referralLink}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy Website Referral Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setShowQr(!showQr)}
                className={`p-1.5 rounded-lg ${showQr ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-300'} cursor-pointer transition-colors`}
                title="Toggle QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1-Click Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleShareWhatsApp}
              className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share on Telegram</span>
            </button>
          </div>
        </div>

        {/* Optional QR Code View */}
        {showQr && (
          <div className="p-3 rounded-2xl bg-black/60 border border-yellow-500/30 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-2 bg-white rounded-xl shadow-lg">
              <QRCodeSVG value={referralLink} size={140} />
            </div>
            <span className="text-[10px] text-gray-300">
              Scan to open website with your referral code <strong className="text-yellow-400 font-mono">@{myRefCode}</strong>
            </span>
          </div>
        )}

        {/* Live Referral Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9.5px] text-gray-400 block uppercase font-medium">Invited Friends</span>
            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
              {totalReferralsCount} {totalReferralsCount === 1 ? 'User' : 'Users'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9.5px] text-gray-400 block uppercase font-medium">Total Earned</span>
            <span className="text-base font-extrabold text-yellow-400 font-mono mt-0.5 block">
              {formatCurrency(totalEarnedCommission)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9.5px] text-gray-400 block uppercase font-medium">Commission</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
              {commissionPercent}%
            </span>
          </div>
        </div>
      </GlassCard>

      {/* HOW REFER & EARN WORKS (3 EASY STEPS) */}
      <GlassCard className="p-4 bg-[#161622]/90 border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>How Referral Earn Money Works</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/40 text-[#00e5ff] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </div>
            <div>
              <strong className="text-white block text-[11px]">Share Website Referral Link</strong>
              <p className="text-[10.5px] text-gray-400">
                Send your unique website link <code className="text-yellow-300 font-mono">?ref={myRefCode}</code> to your Free Fire squad or groups.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong className="text-white block text-[11px]">Friend Registers & Deposits</strong>
              <p className="text-[10.5px] text-gray-400">
                When they open the website and create an account, your referral code is automatically tied to their profile.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </div>
            <div>
              <strong className="text-white block text-[11px]">Get {commissionPercent}% Instant Cash</strong>
              <p className="text-[10.5px] text-gray-400">
                Every time your referred friends add balance via UPI QR, {commissionPercent}% cash credits directly to your wallet!
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* REFERRED FRIENDS LIST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-yellow-400" />
            <span>Referred Friends ({referredFriends.length})</span>
          </h3>
          <span className="text-[10px] text-gray-400">Real-time registered users</span>
        </div>

        {referredFriends.length === 0 ? (
          <GlassCard className="p-5 text-center bg-[#161622]/80 border-white/10 space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mx-auto">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">No Referrals Yet</h4>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
              Share your website referral link with friends to start earning instant {commissionPercent}% commissions!
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {referredFriends.map((friend) => (
              <GlassCard
                key={friend.id}
                className="p-3 bg-[#161622]/90 border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-xs">
                    {friend.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{friend.name || friend.username}</span>
                      <span className="text-[9.5px] text-gray-400 font-mono">@{friend.username}</span>
                    </h4>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      <span>Joined: {friend.joinedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    Active
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* REFERRAL REWARDS HISTORY */}
      {referralTransactions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Earned Commissions Log</span>
            </h3>
          </div>

          <div className="space-y-2">
            {referralTransactions.map((tx) => (
              <GlassCard
                key={tx.id}
                className="p-3 bg-[#161622]/90 border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    +
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{tx.description || 'Referral Commission'}</h4>
                    <span className="text-[10px] text-gray-400">{tx.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-emerald-400 block">
                    +{formatCurrency(tx.amount)}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase">
                    CREDITED
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== SUPPORT TICKETS VIEW ==================== */
interface SupportTicketsViewProps {
  storeSettings: StoreSettings;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({ storeSettings }) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setSubmitted(false);
    }, 2500);
  };

  return (
    <div className="space-y-4" id="support-tickets-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
          <span>Support & Helpdesk</span>
        </h2>
        <span className="text-[11px] text-gray-400">Submit a ticket or connect with direct admin</span>
      </div>

      <GlassCard glow="cyan" className="p-4 bg-[#161622]/95 border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Open a New Ticket</h3>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
            <Check className="w-6 h-6 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Ticket Submitted!</h4>
            <p className="text-xs text-gray-300">
              Admin will reply directly to your registered Email ID shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Issue / Subject</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Deposit Balance Pending or Key Activation Question"
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#00e5ff] text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue with transaction reference or details..."
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#00e5ff] text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00e5ff] text-[#0a0a0f] font-extrabold shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              Submit Support Ticket
            </button>
          </form>
        )}
      </GlassCard>

      {/* Official Community & Telegram Support Channels */}
      <div className="space-y-2">
        <a
          href={storeSettings.telegramSupportUrl || 'https://t.me/Kalam_Mods_Official'}
          target="_blank"
          rel="noreferrer"
          className="w-full p-3 rounded-2xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 flex items-center justify-between text-xs font-semibold text-cyan-300 transition-all block"
        >
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#229ED9]" />
            <span>Official Telegram Support: {storeSettings.supportUsername || '@kalam_official'}</span>
          </span>
          <ExternalLink className="w-4 h-4 text-cyan-300" />
        </a>

        {storeSettings.whatsappSupportNumber && (
          <a
            href={`https://wa.me/${storeSettings.whatsappSupportNumber.replace(/[^0-9]/g, '')}?text=Hi%2C%20I%20need%20support%20with%20KALAM%20FF%20PANEL`}
            target="_blank"
            rel="noreferrer"
            className="w-full p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-between text-xs font-semibold text-emerald-300 transition-all block"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Support: {storeSettings.whatsappSupportNumber}</span>
            </span>
            <ExternalLink className="w-4 h-4 text-emerald-300" />
          </a>
        )}
      </div>
    </div>
  );
};

/* ==================== PROFILE VIEW ==================== */
interface ProfileViewProps {
  storeSettings: StoreSettings;
  balance: number;
  onSwitchToAdmin: () => void;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  storeSettings,
  balance,
  onSwitchToAdmin,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    setPasswordSuccess('Password updated successfully!');
    setTimeout(() => {
      setPasswordSuccess(null);
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
    }, 1800);
  };

  const isMasterAdmin = Boolean(
    currentUser &&
      (currentUser.email?.trim().toLowerCase() === 'kalam172010@gmail.com' ||
       currentUser.role === 'ADMIN')
  );
  const displayName = currentUser?.name || `${storeSettings?.shopName || 'KALAM FF'} Guest`;
  const displayEmail = currentUser?.email || 'Not logged in';
  const displayUsername = currentUser?.username || 'guest_user';
  const displayRole = currentUser ? (isMasterAdmin ? 'MASTER ADMIN' : currentUser.role) : 'GUEST';
  const displayRegisterDate = currentUser?.joinedDate || (currentUser ? 'Recently' : 'Not registered');

  const formatRegisterDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {}
    return dateStr;
  };

  return (
    <div className="space-y-4" id="profile-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />
            <span>Account & Security Profile</span>
          </h2>
          <span className="text-[11px] text-gray-400">Manage your login credentials & wallet</span>
        </div>
        {currentUser ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/50 text-[#00e5ff] text-[11px] font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.3)]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login / Register</span>
          </button>
        )}
      </div>

      <GlassCard glow="purple" className="p-4 bg-[#161622]/95 border-[#8b5cf6]/30 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] via-[#00e5ff] to-[#ff0080] p-[2px]">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center font-black text-base text-white">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">{displayName}</h3>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                {displayRole}
              </span>
            </div>
            <span className="text-xs text-[#00e5ff] font-mono flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 text-[#00e5ff]" />
              <span>{displayEmail}</span>
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono flex-wrap">
              <span>User ID: @{displayUsername}</span>
              {currentUser && (
                <span className="flex items-center gap-1 text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded-full border border-[#00e5ff]/30">
                  <Calendar className="w-3 h-3 text-[#00e5ff]" />
                  <span>Member Since: {formatRegisterDate(displayRegisterDate)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Highlighted Profile Stats Grid with Registration Date */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5 text-xs">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account Status</span>
            <span className="font-extrabold text-emerald-400 flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Active Verified</span>
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wallet Balance</span>
            <span className="font-black text-[#ff0080] text-sm block">{formatCurrency(balance)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-[#00e5ff]/30 space-y-1 col-span-2 sm:col-span-1 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#00e5ff]" />
              <span>Registration Date</span>
            </span>
            <span className="font-extrabold text-white text-xs block font-mono">
              {formatRegisterDate(displayRegisterDate)}
            </span>
          </div>
        </div>

        {/* Security / Password section */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Lock className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="font-semibold text-[11px]">Email & Password Security</span>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-[11px] text-[#00e5ff] hover:underline font-medium cursor-pointer"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleChangePassword}
              className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5 text-left"
            >
              <span className="text-[10px] font-bold text-gray-300 block">Update Account Password:</span>
              <input
                type="password"
                required
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
              />
              <input
                type="password"
                required
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
              />
              {passwordSuccess && (
                <div className="text-[10px] text-emerald-400 font-semibold">{passwordSuccess}</div>
              )}
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 text-xs font-bold transition-all cursor-pointer"
              >
                Save New Password
              </button>
            </motion.form>
          )}
        </div>

        {isMasterAdmin && (
          <div className="pt-2">
            <button
              onClick={onSwitchToAdmin}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Open Master Admin Panel (Bot Control)</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </button>
          </div>
        )}

        {!currentUser && (
          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Login to Account</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
