import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  RotateCcw,
  Save,
  Link2,
  Eye,
  EyeOff,
  Megaphone,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  Phone,
  Coins,
  DollarSign,
  Gift,
  KeyRound,
  Mail,
  Palette,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Play,
  Monitor,
  Smartphone,
  Copy,
  Trash2,
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { StoreLogo } from '../shared/store-logo';

// Curated 100% reliable SVG Data URIs for instant 1-click Logo Presets
const LOGO_PRESETS = [
  {
    id: 'default',
    name: 'Original Shield',
    tag: 'Classic',
    url: '/logo.svg',
    color: '#00e5ff',
  },
  {
    id: 'cyber_skull',
    name: 'Cyber Mask',
    tag: 'VIP Gaming',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300e5ff"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="%230a0a14"/><circle cx="50" cy="50" r="42" fill="none" stroke="url(%23g1)" stroke-width="3"/><path d="M30 42 C30 25 70 25 70 42 C70 58 64 68 50 78 C36 68 30 58 30 42 Z" fill="%23121128" stroke="url(%23g1)" stroke-width="3"/><circle cx="42" cy="45" r="5" fill="%2300e5ff"/><circle cx="58" cy="45" r="5" fill="%238b5cf6"/><path d="M44 62 L47 57 L53 57 L56 62" stroke="%2300e5ff" stroke-width="2" fill="none"/><line x1="42" y1="70" x2="42" y2="76" stroke="%238b5cf6" stroke-width="2"/><line x1="50" y1="70" x2="50" y2="76" stroke="%2300e5ff" stroke-width="2"/><line x1="58" y1="70" x2="58" y2="76" stroke="%238b5cf6" stroke-width="2"/></svg>',
    color: '#8b5cf6',
  },
  {
    id: 'golden_crown',
    name: 'Golden Crown',
    tag: 'Royal FF',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="50%" stop-color="%23fbbf24"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="%23161206"/><circle cx="50" cy="50" r="42" fill="none" stroke="url(%23gold)" stroke-width="3"/><path d="M22 66 L26 36 L40 52 L50 26 L60 52 L74 36 L78 66 Z" fill="%23221a08" stroke="url(%23gold)" stroke-width="3.5" stroke-linejoin="round"/><circle cx="26" cy="34" r="3.5" fill="%23fbbf24"/><circle cx="50" cy="24" r="4.5" fill="%23fef08a"/><circle cx="74" cy="34" r="3.5" fill="%23fbbf24"/><circle cx="50" cy="56" r="4" fill="%23f59e0b"/></svg>',
    color: '#f59e0b',
  },
  {
    id: 'fire_phoenix',
    name: 'Fire Phoenix',
    tag: 'FreeFire',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="fire" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ef4444"/><stop offset="50%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23eab308"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="%231a0808"/><path d="M50 15 C55 28 65 34 72 45 C80 58 75 75 62 82 C50 88 34 84 27 72 C22 62 25 50 32 42 C32 52 38 60 46 62 C43 54 44 44 48 38 C52 46 56 50 56 56 C60 52 61 46 59 40 C63 43 65 48 64 54 C67 50 67 43 62 36 C57 29 52 23 50 15 Z" fill="url(%23fire)"/></svg>',
    color: '#ef4444',
  },
  {
    id: 'hologram_key',
    name: 'Cyber Key',
    tag: 'Key Master',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="neonKey" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300e5ff"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="%230f0f1c"/><circle cx="42" cy="40" r="18" fill="none" stroke="url(%23neonKey)" stroke-width="4"/><circle cx="42" cy="40" r="8" fill="none" stroke="%2300e5ff" stroke-width="2"/><path d="M54 52 L78 76 L86 68 L80 62 L74 68 L70 64 L76 58" stroke="url(%23neonKey)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    color: '#ec4899',
  },
  {
    id: 'matrix_crest',
    name: 'Emerald Matrix',
    tag: 'Hacker Crest',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="matrix" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23065f46"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="%2306140d"/><polygon points="50,15 85,32 85,68 50,85 15,68 15,32" fill="%230a2116" stroke="%2310b981" stroke-width="3"/><path d="M35 45 L50 35 L65 45 L65 60 L50 70 L35 60 Z" fill="none" stroke="%2334d399" stroke-width="2.5"/><circle cx="50" cy="52" r="6" fill="%2310b981"/></svg>',
    color: '#10b981',
  },
];

const THEME_ACCENTS = [
  { id: 'cyan', name: 'Cyan Glow', hex: '#00e5ff', bg: 'from-cyan-500 to-blue-600', text: 'text-[#00e5ff]' },
  { id: 'purple', name: 'Neon Purple', hex: '#a855f7', bg: 'from-purple-600 to-indigo-600', text: 'text-purple-400' },
  { id: 'gold', name: 'Golden VIP', hex: '#f59e0b', bg: 'from-amber-500 to-yellow-500', text: 'text-yellow-400' },
  { id: 'emerald', name: 'Emerald Cyber', hex: '#10b981', bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-400' },
  { id: 'rose', name: 'Rose Laser', hex: '#f43f5e', bg: 'from-rose-500 to-pink-600', text: 'text-rose-400' },
  { id: 'blue', name: 'Electric Blue', hex: '#3b82f6', bg: 'from-blue-600 to-sky-500', text: 'text-blue-400' },
] as const;

interface AdminStoreCustomizerViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export const AdminStoreCustomizerView: React.FC<AdminStoreCustomizerViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  // Navigation tabs inside customizer for clean UI
  const [activeTab, setActiveTab] = useState<'branding' | 'sections' | 'announcements' | 'support' | 'financial' | 'security'>('branding');

  // 1. Logo & Visual Branding
  const [shopName, setShopName] = useState(settings.shopName || 'KALAM FF PANEL');
  const [tagline, setTagline] = useState(settings.tagline || 'Powered by KALAM • Instant 24/7 Delivery');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '/logo.svg');
  const [logoShape, setLogoShape] = useState<'rounded' | 'circle' | 'square'>(settings.logoShape || 'rounded');
  const [logoGlowColor, setLogoGlowColor] = useState<'cyan' | 'purple' | 'gold' | 'emerald' | 'pink'>(
    settings.logoGlowColor || 'cyan'
  );
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg'>(settings.logoSize || 'md');
  const [themeAccent, setThemeAccent] = useState<'cyan' | 'purple' | 'gold' | 'emerald' | 'rose' | 'blue'>(
    settings.themeAccent || 'cyan'
  );

  // 2. Storefront Layout & Section Visibility
  const [showHeroCard, setShowHeroCard] = useState(settings.showHeroCard ?? true);
  const [showTopSellers, setShowTopSellers] = useState(settings.showTopSellers ?? true);
  const [showQuickActions, setShowQuickActions] = useState(settings.showQuickActions ?? true);
  const [showDepositGuide, setShowDepositGuide] = useState(settings.showDepositGuide ?? true);
  const [showCatalogPreview, setShowCatalogPreview] = useState(settings.showCatalogPreview ?? true);
  const [storeNoticeBadge, setStoreNoticeBadge] = useState(
    settings.storeNoticeBadge || '⚡ 100% INSTANT DIRECT CREDIT'
  );

  // 3. Announcements & Maintenance
  const [announcementText, setAnnouncementText] = useState(
    settings.announcementText || '🔥 FASTEST FREE FIRE KEY DELIVERY ACTIVE 24/7! INSTANT UPI AUTO-CREDIT.'
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(settings.announcementEnabled ?? true);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode ?? false);

  // 4. Customer Support & Social Channels
  const [supportUsername, setSupportUsername] = useState(settings.supportUsername || '@kd_123_1_3');
  const [telegramSupportUrl, setTelegramSupportUrl] = useState(
    settings.telegramSupportUrl || 'https://t.me/kd_123_1_3'
  );
  const [whatsappSupportNumber, setWhatsappSupportNumber] = useState(
    settings.whatsappSupportNumber || '+91 9876543210'
  );
  const [paymentProofChannel, setPaymentProofChannel] = useState(
    settings.paymentProofChannel || 'https://t.me/yourchannel'
  );
  const [howToUseBotLink, setHowToUseBotLink] = useState(
    settings.howToUseBotLink || 'https://t.me/yourchannel/3'
  );
  const [discordSupportUrl, setDiscordSupportUrl] = useState(settings.discordSupportUrl || '');

  // 5. Financial & Deposit Rules
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [minDeposit, setMinDeposit] = useState(settings.minDeposit ?? 1);
  const [depositBonusPercent, setDepositBonusPercent] = useState(settings.depositBonusPercent ?? 0);
  const [referralBonusPercent, setReferralBonusPercent] = useState(settings.referralBonusPercent ?? 10);
  const [dailySpinEnabled, setDailySpinEnabled] = useState(settings.dailySpinEnabled ?? true);
  const [enableUtrInput, setEnableUtrInput] = useState<boolean>(settings.enableUtrInput !== false);
  const [upiManualId, setUpiManualId] = useState(settings.upiManualId || settings.upiId || '8056317218@fam');
  const [upiMerchantName, setUpiMerchantName] = useState(
    settings.upiMerchantName || settings.merchantUpi || 'KALAM FF PANEL PAYMENTS'
  );
  const [customQrUrl, setCustomQrUrl] = useState(settings.customQrUrl || '');
  const [manualPaymentInstructions, setManualPaymentInstructions] = useState(
    settings.manualPaymentInstructions ||
      '1. Scan QR code or tap your preferred UPI app.\n2. Pay exact amount from PhonePe, GPay, or Paytm.\n3. Payment is automatically detected and credited instantly.'
  );

  // 6. Security
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || 'kalam172010@gmail.com');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'kalam@172010');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // File Upload Ref & State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSectionSaved, setActiveSectionSaved] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    if (settings) {
      if (settings.shopName !== undefined) setShopName(settings.shopName);
      if (settings.tagline !== undefined) setTagline(settings.tagline);
      if (settings.logoUrl !== undefined) setLogoUrl(settings.logoUrl);
      if (settings.logoShape !== undefined) setLogoShape(settings.logoShape);
      if (settings.logoGlowColor !== undefined) setLogoGlowColor(settings.logoGlowColor);
      if (settings.logoSize !== undefined) setLogoSize(settings.logoSize);
      if (settings.themeAccent !== undefined) setThemeAccent(settings.themeAccent);

      if (settings.showHeroCard !== undefined) setShowHeroCard(settings.showHeroCard);
      if (settings.showTopSellers !== undefined) setShowTopSellers(settings.showTopSellers);
      if (settings.showQuickActions !== undefined) setShowQuickActions(settings.showQuickActions);
      if (settings.showDepositGuide !== undefined) setShowDepositGuide(settings.showDepositGuide);
      if (settings.showCatalogPreview !== undefined) setShowCatalogPreview(settings.showCatalogPreview);
      if (settings.storeNoticeBadge !== undefined) setStoreNoticeBadge(settings.storeNoticeBadge);

      if (settings.announcementText !== undefined) setAnnouncementText(settings.announcementText);
      if (settings.announcementEnabled !== undefined) setAnnouncementEnabled(settings.announcementEnabled);
      if (settings.maintenanceMode !== undefined) setMaintenanceMode(settings.maintenanceMode);

      if (settings.supportUsername !== undefined) setSupportUsername(settings.supportUsername);
      if (settings.telegramSupportUrl !== undefined) setTelegramSupportUrl(settings.telegramSupportUrl);
      if (settings.whatsappSupportNumber !== undefined) setWhatsappSupportNumber(settings.whatsappSupportNumber);
      if (settings.paymentProofChannel !== undefined) setPaymentProofChannel(settings.paymentProofChannel);
      if (settings.howToUseBotLink !== undefined) setHowToUseBotLink(settings.howToUseBotLink);
      if (settings.discordSupportUrl !== undefined) setDiscordSupportUrl(settings.discordSupportUrl);

      if (settings.currencySymbol !== undefined) setCurrencySymbol(settings.currencySymbol);
      if (settings.minDeposit !== undefined) setMinDeposit(settings.minDeposit);
      if (settings.depositBonusPercent !== undefined) setDepositBonusPercent(settings.depositBonusPercent);
      if (settings.referralBonusPercent !== undefined) setReferralBonusPercent(settings.referralBonusPercent);
      if (settings.dailySpinEnabled !== undefined) setDailySpinEnabled(settings.dailySpinEnabled);

      if (settings.enableUtrInput !== undefined) setEnableUtrInput(settings.enableUtrInput);
      if (settings.upiManualId !== undefined || settings.upiId !== undefined) {
        setUpiManualId(settings.upiManualId || settings.upiId || '8056317218@fam');
      }
      if (settings.upiMerchantName !== undefined || settings.merchantUpi !== undefined) {
        setUpiMerchantName(settings.upiMerchantName || settings.merchantUpi || 'KALAM FF PANEL PAYMENTS');
      }
      if (settings.customQrUrl !== undefined) setCustomQrUrl(settings.customQrUrl);
      if (settings.manualPaymentInstructions !== undefined) {
        setManualPaymentInstructions(settings.manualPaymentInstructions);
      }

      if (settings.adminEmail !== undefined) setAdminEmail(settings.adminEmail);
      if (settings.adminPassword !== undefined) setAdminPassword(settings.adminPassword);
    }
  }, [settings]);

  // Handle Local File Upload & convert to Data URL
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WEBP, GIF).');
      return;
    }

    // Limit to 2MB to keep performance fast
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size is too large (max 2MB). Please select a smaller image or use an image URL.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Compile entire store configuration object
  const buildCurrentSettings = (): StoreSettings => {
    return {
      ...settings,
      shopName: shopName.trim() || 'KALAM FF PANEL',
      tagline: tagline.trim() || 'Powered by KALAM',
      logoUrl: logoUrl.trim() || '/logo.svg',
      logoShape,
      logoGlowColor,
      logoSize,
      themeAccent,

      showHeroCard: Boolean(showHeroCard),
      showTopSellers: Boolean(showTopSellers),
      showQuickActions: Boolean(showQuickActions),
      showDepositGuide: Boolean(showDepositGuide),
      showCatalogPreview: Boolean(showCatalogPreview),
      storeNoticeBadge: storeNoticeBadge.trim(),

      currencySymbol: currencySymbol.trim() || '₹',
      announcementText: announcementText.trim(),
      announcementEnabled: Boolean(announcementEnabled),
      maintenanceMode: Boolean(maintenanceMode),

      supportUsername: supportUsername.trim(),
      telegramSupportUrl: telegramSupportUrl.trim(),
      whatsappSupportNumber: whatsappSupportNumber.trim(),
      paymentProofChannel: paymentProofChannel.trim(),
      howToUseBotLink: howToUseBotLink.trim(),
      discordSupportUrl: discordSupportUrl.trim(),

      minDeposit: Math.max(1, Number(minDeposit) || 1),
      depositBonusPercent: Math.max(0, Number(depositBonusPercent) || 0),
      referralBonusPercent: Math.max(0, Number(referralBonusPercent) || 0),
      dailySpinEnabled: Boolean(dailySpinEnabled),

      enableUtrInput: Boolean(enableUtrInput),
      upiId: upiManualId.trim(),
      upiManualId: upiManualId.trim(),
      merchantUpi: upiMerchantName.trim(),
      upiMerchantName: upiMerchantName.trim(),
      customQrUrl: customQrUrl.trim(),
      manualPaymentInstructions: manualPaymentInstructions.trim(),

      adminEmail: adminEmail.trim().toLowerCase(),
      adminPassword: adminPassword.trim(),
    };
  };

  const handleSave = (section?: string) => {
    const updated = buildCurrentSettings();
    onSaveSettings(updated);
    if (section) {
      setActiveSectionSaved(section);
      setTimeout(() => setActiveSectionSaved(null), 2000);
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset store branding and layout back to default settings?')) {
      setShopName('KALAM FF PANEL');
      setTagline('Powered by KALAM • Instant 24/7 Delivery');
      setLogoUrl('/logo.svg');
      setLogoShape('rounded');
      setLogoGlowColor('cyan');
      setLogoSize('md');
      setThemeAccent('cyan');
      setShowHeroCard(true);
      setShowTopSellers(true);
      setShowQuickActions(true);
      setShowDepositGuide(true);
      setShowCatalogPreview(true);
      setStoreNoticeBadge('⚡ 100% INSTANT DIRECT CREDIT');
      setCurrencySymbol('₹');
      setAnnouncementText('🔥 FASTEST FREE FIRE KEY DELIVERY ACTIVE 24/7! INSTANT UPI AUTO-CREDIT.');
      setAnnouncementEnabled(true);
      setMaintenanceMode(false);
      setMinDeposit(1);
      setDepositBonusPercent(0);
      setReferralBonusPercent(10);
      setDailySpinEnabled(true);
    }
  };

  return (
    <div className="space-y-4 text-white" id="admin-store-customizer">
      {/* Top Banner Header */}
      <div className="bg-[#12121e] border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00e5ff]/20 to-[#8b5cf6]/30 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>User Storefront Customizer & Logo Manager</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE CONTROL
                </span>
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-gray-300 font-medium">
            Manually change your website logo, storefront theme colors, layout sections, support contacts, and announcements.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] via-cyan-400 to-[#8b5cf6] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Saved & Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black" />
                <span>Save All Changes</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Clean Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Website Logo & Brand</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sections'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Storefront Layout</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Announcements & Marquee</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support & Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'financial'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Financial Rules & Spin</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Master Security</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEBSITE LOGO & VISUAL BRAND IDENTITY */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="space-y-4">
          {/* Main Logo Customization Box */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Website Logo Manual Changing
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Upload your custom image file, paste any image URL, or choose a 1-click VIP preset.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('branding')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'branding' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'branding' ? 'Saved' : 'Save Logo'}</span>
              </button>
            </div>

            {/* Live Logo Preview Box */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-1 bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] shadow-[0_0_25px_rgba(0,229,255,0.4)] shrink-0 ${
                    logoShape === 'circle'
                      ? 'rounded-full'
                      : logoShape === 'square'
                      ? 'rounded-xl'
                      : 'rounded-2xl'
                  }`}
                >
                  <StoreLogo
                    logoUrl={logoUrl}
                    alt="Active Store Logo"
                    className={`object-cover ${
                      logoSize === 'sm' ? 'w-10 h-10' : logoSize === 'lg' ? 'w-16 h-16' : 'w-14 h-14'
                    } ${
                      logoShape === 'circle'
                        ? 'rounded-full'
                        : logoShape === 'square'
                        ? 'rounded-lg'
                        : 'rounded-[14px]'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase">{shopName || 'KALAM FF PANEL'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                      LIVE LOGO
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{tagline || 'Powered by KALAM'}</p>
                  <div className="text-[9px] text-gray-500 font-mono truncate max-w-xs sm:max-w-md">
                    Source: {logoUrl.startsWith('data:') ? 'Custom Uploaded File (Embedded Base64)' : logoUrl}
                  </div>
                </div>
              </div>

              {/* Quick Reset to default */}
              <button
                type="button"
                onClick={() => setLogoUrl('/logo.svg')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>Restore /logo.svg</span>
              </button>
            </div>

            {/* Two Methods to change Logo: 1. Local File Upload, 2. Direct Image URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Method A: Manual Local File Upload */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                    : 'border-white/15 bg-black/30 hover:border-cyan-400/50 hover:bg-white/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>

                <div className="text-xs font-bold text-white mb-0.5">
                  {isUploading ? 'Processing Image...' : 'Upload Image from Computer/Phone'}
                </div>
                <p className="text-[10px] text-gray-400 max-w-xs">
                  Click to browse or drag & drop PNG, JPG, SVG, or WEBP (Max 2MB).
                </p>

                {uploadError && (
                  <div className="mt-2 text-[10px] text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Method B: Paste Image URL */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-[11px] font-bold text-gray-200 block mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Paste Direct Image URL</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">
                    Enter direct image address from Discord, Imgur, PostImages, or Cloudinary.
                  </p>
                  <input
                    type="text"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/images/my-logo.png"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>Accepts .png, .jpg, .svg, .webp</span>
                  {logoUrl && !logoUrl.startsWith('data:') && (
                    <span className="text-emerald-400 font-mono">Valid Link Set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>1-Click VIP Logo Presets</span>
                </span>
                <span className="text-[10px] text-gray-500">Instant high-res emblems</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {LOGO_PRESETS.map((preset) => {
                  const isSelected = logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLogoUrl(preset.url)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                          : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        <StoreLogo logoUrl={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 w-full">
                        <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
                        <div className="text-[9px] text-gray-400">{preset.tag}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo Display Customization (Shape, Size, Aura) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Logo Frame Shape</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['rounded', 'circle', 'square'] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setLogoShape(shape)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        logoShape === shape
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {shape === 'rounded' ? 'Squircle' : shape}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Logo Glow Aura</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['cyan', 'purple', 'gold', 'emerald', 'pink'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setLogoGlowColor(color)}
                      className={`h-7 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer flex items-center justify-center ${
                        logoGlowColor === color ? 'border-2 border-white scale-105 shadow-md' : 'border border-white/10'
                      } ${
                        color === 'cyan'
                          ? 'bg-cyan-500/30 text-cyan-300'
                          : color === 'purple'
                          ? 'bg-purple-500/30 text-purple-300'
                          : color === 'gold'
                          ? 'bg-yellow-500/30 text-yellow-300'
                          : color === 'emerald'
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      {color[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Logo Size</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setLogoSize(size)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        logoSize === size
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {size === 'sm' ? 'Compact' : size === 'md' ? 'Regular' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Store Name & Tagline Identity Box */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Store Title & Brand Slogan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleSave('text_brand')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'text_brand' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'text_brand' ? 'Saved' : 'Save Title'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Store / Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="KALAM FF PANEL"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400 focus:outline-none text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Powered by KALAM • Instant 24/7 Delivery"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400 focus:outline-none text-gray-200"
                />
              </div>
            </div>

            {/* Theme Accent Color Selection */}
            <div className="pt-2">
              <label className="text-[10px] text-gray-300 block mb-1 font-semibold">
                Storefront Theme Primary Accent
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {THEME_ACCENTS.map((accent) => {
                  const isSelected = themeAccent === accent.id;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => setThemeAccent(accent.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-white/10 border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: accent.hex }} />
                      <span className={`text-[11px] font-bold ${accent.text}`}>{accent.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOREFRONT SECTIONS & LAYOUT CUSTOMIZING */}
      {/* ========================================================================= */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Manual User Store Layout & Visibility Controls
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Turn specific homepage modules ON or OFF to fit your store style.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('sections')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'sections' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'sections' ? 'Saved' : 'Save Layout'}</span>
              </button>
            </div>

            {/* Custom Store Notice Badge */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-200 font-bold block">
                Store Trust Badge Text (Displays on Top Hero Card)
              </label>
              <input
                type="text"
                value={storeNoticeBadge}
                onChange={(e) => setStoreNoticeBadge(e.target.value)}
                placeholder="⚡ 100% INSTANT DIRECT CREDIT"
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400 focus:outline-none text-white font-mono text-xs"
              />
              <span className="text-[10px] text-gray-500">
                Shows next to the logo in the storefront hero banner (e.g. "⚡ 100% DIRECT CREDIT", "🔥 VIP ANTI-BAN MODS").
              </span>
            </div>

            {/* Section Toggles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Toggle 1: Hero Branding Banner Card */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Top Branding Hero Card</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Displays your logo, shop title, tagline, and active status in a top banner.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHeroCard(!showHeroCard)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    showHeroCard ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showHeroCard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: How to Deposit Pill in Header */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-400" />
                    <span>"HOW TO DEPOSIT?" Button in Header</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Prominent red video pill in the top navbar directing users to your tutorial.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDepositGuide(!showDepositGuide)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    showDepositGuide ? 'bg-red-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showDepositGuide ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Quick Actions Grid */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quick Actions Grid (6 Buttons)</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Deposit, Buy Keys, Daily Spin, My Keys, History, and Support icons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    showQuickActions ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showQuickActions ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Store Products Catalog Preview */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Store Products Catalog Preview</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Shows instant product list on the home screen with "Buy" action.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogPreview(!showCatalogPreview)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    showCatalogPreview ? 'bg-pink-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showCatalogPreview ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 5: Top Sellers Leaderboard */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Top Sellers Leaderboard</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Leaderboard showcasing top monthly resellers and bonus rewards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopSellers(!showTopSellers)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    showTopSellers ? 'bg-yellow-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showTopSellers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANNOUNCEMENTS & MAINTENANCE */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Storefront Announcements & Maintenance
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Control live top marquee news banner and emergency store lockdown.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('announcements')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'announcements' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'announcements' ? 'Saved' : 'Save Marquee'}</span>
              </button>
            </div>

            {/* Live Marquee Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Top Scrolling Announcement Marquee</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    announcementEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/10 text-gray-400 border border-white/10'
                  }`}
                >
                  {announcementEnabled ? 'ACTIVE / SHOWING' : 'DISABLED / HIDDEN'}
                </button>
              </div>

              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={2}
                placeholder="🔥 FASTEST FREE FIRE KEY DELIVERY ACTIVE 24/7! INSTANT UPI AUTO-CREDIT."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 focus:outline-none text-white text-xs"
              />

              {announcementEnabled && announcementText && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/20 to-pink-500/15 border border-cyan-500/30 text-[11px] text-white flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 text-[9px] font-black uppercase shrink-0">
                    PREVIEW
                  </span>
                  <span className="truncate">{announcementText}</span>
                </div>
              )}
            </div>

            {/* Maintenance Mode Alert */}
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Store Emergency Maintenance Mode</span>
                </div>
                <p className="text-[10px] text-red-200/80">
                  When enabled, users see a high-priority red alert banner across the storefront.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  maintenanceMode ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPORT CHANNELS & SOCIAL LINKS */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Customer Support Channels & Socials
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Direct Telegram, WhatsApp, YouTube, and Discord links displayed to your users.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('support')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'support' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'support' ? 'Saved' : 'Save Support'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-cyan-400" />
                  <span>Telegram Support Username</span>
                </label>
                <input
                  type="text"
                  value={supportUsername}
                  onChange={(e) => setSupportUsername(e.target.value)}
                  placeholder="@kd_123_1_3"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-cyan-400" />
                  <span>Telegram Direct Link</span>
                </label>
                <input
                  type="text"
                  value={telegramSupportUrl}
                  onChange={(e) => setTelegramSupportUrl(e.target.value)}
                  placeholder="https://t.me/kd_123_1_3"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Official WhatsApp Support Number</span>
                </label>
                <input
                  type="text"
                  value={whatsappSupportNumber}
                  onChange={(e) => setWhatsappSupportNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <Play className="w-3 h-3 text-red-400" />
                  <span>How-to-Use Video Tutorial Link</span>
                </label>
                <input
                  type="text"
                  value={howToUseBotLink}
                  onChange={(e) => setHowToUseBotLink(e.target.value)}
                  placeholder="https://t.me/yourchannel/3 or YouTube link"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-yellow-400" />
                  <span>Payment Proofs Channel URL</span>
                </label>
                <input
                  type="text"
                  value={paymentProofChannel}
                  onChange={(e) => setPaymentProofChannel(e.target.value)}
                  placeholder="https://t.me/yourchannel"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                  <span>Discord Community Link (Optional)</span>
                </label>
                <input
                  type="text"
                  value={discordSupportUrl}
                  onChange={(e) => setDiscordSupportUrl(e.target.value)}
                  placeholder="https://discord.gg/yourserver"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FINANCIAL RULES & DAILY SPIN */}
      {/* ========================================================================= */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Financial Rates & Referral Rewards
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Minimum deposit limits, currency symbol, spin wheel, and referral bonuses.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('financial')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'financial' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'financial' ? 'Saved' : 'Save Rates'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Store Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="₹"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-blue-400 focus:outline-none text-emerald-400 font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">
                  Minimum Deposit ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(Number(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-blue-400 focus:outline-none text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Deposit Bonus (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={depositBonusPercent}
                  onChange={(e) => setDepositBonusPercent(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-blue-400 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold">Referral Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={referralBonusPercent}
                  onChange={(e) => setReferralBonusPercent(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-blue-400 focus:outline-none text-yellow-300 font-mono font-bold"
                />
              </div>
            </div>

            {/* Daily Spin Toggle */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-400" />
                <div>
                  <div className="text-xs font-bold text-white">Daily Lucky Spin Wheel</div>
                  <p className="text-[10px] text-gray-400">Allow users to spin once per day for free wallet balance bonuses.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailySpinEnabled(!dailySpinEnabled)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  dailySpinEnabled ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    dailySpinEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MASTER ADMIN SECURITY & CREDENTIALS */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border-t-2 border-t-amber-500 border-x border-b border-amber-500/30 rounded-2xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-yellow-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Admin Master Login Security</span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-yellow-300 border border-amber-500/40">
                      CONFIDENTIAL
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Master email and password used to access and unlock the Admin Control Center.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSave('security')}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-yellow-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {activeSectionSaved === 'security' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>{activeSectionSaved === 'security' ? 'Saved' : 'Save Security'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <Mail className="w-3 h-3 text-yellow-400" />
                  <span>Authorized Master Admin Email</span>
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="kalam172010@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 focus:outline-none text-yellow-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-300 block mb-1 font-semibold flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-yellow-400" />
                  <span>Admin Master Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Set admin password"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 focus:outline-none text-white font-mono font-bold pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
