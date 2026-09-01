import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Crown,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Key,
  Trash2,
  Edit2,
  Check,
  Megaphone,
  Save,
  Package,
  CheckCircle2,
  Layers,
  Smartphone,
  Video,
  Play,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  Eye,
  Camera,
  Tv,
  CheckCircle
} from 'lucide-react';
import { Product, PlanPricing } from '../../types';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isYouTubeUrl } from '../../lib/utils';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  editingProduct?: Product | null;
}

const PHOTO_PRESETS = [
  {
    name: 'Free Fire VIP Red',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    tag: 'Free Fire',
  },
  {
    name: '8 Ball Pool Pro',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    tag: '8 Ball Pool',
  },
  {
    name: 'Cyber Bypass Neon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    tag: 'Bypass / Root',
  },
  {
    name: 'Gaming Circuit Dark',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    tag: 'PC / Emulator',
  },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  editingProduct,
}) => {
  // Product Details
  const [name, setName] = useState('');
  const [game, setGame] = useState('FREEFIRE');
  const [deviceType, setDeviceType] = useState('ROOT + NONROOT');
  const [category, setCategory] = useState('Non-Root Mobile');
  const [channelLink, setChannelLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false);

  // Product Photo / Media States
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Plans List
  const [plans, setPlans] = useState<PlanPricing[]>([]);

  // Add Plan form inputs
  const [planDuration, setPlanDuration] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planResellerPrice, setPlanResellerPrice] = useState('');
  const [planKeysText, setPlanKeysText] = useState('');

  // API 1 collapsible in Add Plan
  const [showApi1, setShowApi1] = useState(false);
  const [api1ProductId, setApi1ProductId] = useState('');
  const [api1Duration, setApi1Duration] = useState('');

  // API 2 collapsible in Add Plan
  const [showApi2, setShowApi2] = useState(false);
  const [api2ProductId, setApi2ProductId] = useState('');
  const [api2Duration, setApi2Duration] = useState('');

  // Key viewer toggle per plan
  const [openKeyViewerPlanId, setOpenKeyViewerPlanId] = useState<string | null>(null);
  const [planKeysMap, setPlanKeysMap] = useState<Record<string, string>>({});

  // Inline plan editing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanDuration, setEditPlanDuration] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [editPlanResellerPrice, setEditPlanResellerPrice] = useState('');

  // Success Toast state inside modal
  const [planToast, setPlanToast] = useState<string | null>(null);

  // Helper for generating VIP format keys
  const generateRandomLicenseKeys = (count: number = 10, prefix: string = 'KALAM'): string[] => {
    const keys: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      let part1 = '';
      let part2 = '';
      let part3 = '';
      for (let j = 0; j < 4; j++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let j = 0; j < 4; j++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let j = 0; j < 4; j++) part3 += chars.charAt(Math.floor(Math.random() * chars.length));
      keys.push(`${prefix}-${part1}-${part2}-${part3}`);
    }
    return keys;
  };

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setGame(editingProduct.game || 'FREEFIRE');
      setDeviceType(editingProduct.deviceType || 'ROOT + NONROOT');
      setCategory(editingProduct.category || 'Non-Root Mobile');
      setChannelLink(editingProduct.channelLink || '');
      setVideoUrl(editingProduct.videoUrl || '');
      setImageUrl(editingProduct.imageUrl || '');
      setPlans(editingProduct.plans ? [...editingProduct.plans] : []);

      // Populate plan keys
      const initialKeysMap: Record<string, string> = {};
      if (editingProduct.plans) {
        editingProduct.plans.forEach((p) => {
          if (editingProduct.planKeys && Array.isArray(editingProduct.planKeys[p.id])) {
            initialKeysMap[p.id] = editingProduct.planKeys[p.id].join('\n');
          } else if (Array.isArray(editingProduct.keys)) {
            initialKeysMap[p.id] = editingProduct.keys.join('\n');
          } else {
            initialKeysMap[p.id] = '';
          }
        });
      }
      setPlanKeysMap(initialKeysMap);
    } else {
      setName('');
      setGame('FREEFIRE');
      setDeviceType('ROOT + NONROOT');
      setCategory('Non-Root Mobile');
      setChannelLink('');
      setVideoUrl('');
      setImageUrl('');
      setPlans([]);
      setPlanKeysMap({});
    }

    // Reset Add Plan form
    setPlanDuration('');
    setPlanPrice('');
    setPlanResellerPrice('');
    setPlanKeysText('');
    setShowApi1(false);
    setApi1ProductId('');
    setApi1Duration('');
    setShowApi2(false);
    setApi2ProductId('');
    setApi2Duration('');
    setEditingPlanId(null);
    setPlanToast(null);
    setIsPreviewingVideo(false);
  }, [editingProduct, isOpen]);

  const triggerToast = (msg: string) => {
    setPlanToast(msg);
    setTimeout(() => {
      setPlanToast(null);
    }, 3000);
  };

  // Process and optimize uploaded image via canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 960;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressedUrl);
          triggerToast('Product photo uploaded & optimized!');
        } else {
          setImageUrl(rawDataUrl);
          triggerToast('Product photo loaded!');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleUseYouTubeThumbnail = () => {
    if (!videoUrl.trim()) {
      alert('Please enter a YouTube video URL first in the video field below.');
      return;
    }
    const thumb = getYouTubeThumbnailUrl(videoUrl, 'maxres') || getYouTubeThumbnailUrl(videoUrl, 'hq');
    if (thumb) {
      setImageUrl(thumb);
      triggerToast('YouTube video cover thumbnail set as product photo!');
    } else {
      alert('Could not extract a valid YouTube thumbnail. Please verify your YouTube URL.');
    }
  };

  // Handle adding a new plan (matching video flow)
  const handleAddNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planDuration.trim()) {
      alert('Please enter plan duration (e.g. 1 Day)');
      return;
    }
    if (!planPrice.trim()) {
      alert('Please enter price in ₹');
      return;
    }

    const newPlanId = `plan-${Date.now()}`;
    const newPlan: PlanPricing = {
      id: newPlanId,
      duration: planDuration.trim(),
      price: parseFloat(planPrice) || 0,
      resellerPrice: planResellerPrice ? parseFloat(planResellerPrice) : undefined,
    };

    // Save keys for this plan
    if (planKeysText.trim()) {
      setPlanKeysMap((prev) => ({
        ...prev,
        [newPlanId]: planKeysText.trim(),
      }));
    }

    setPlans((prev) => [...prev, newPlan]);
    triggerToast(`Plan "${newPlan.duration}" added.`);

    // Reset form inputs for fast multi-plan addition
    setPlanDuration('');
    setPlanPrice('');
    setPlanResellerPrice('');
    setPlanKeysText('');
    setShowApi1(false);
    setApi1ProductId('');
    setApi1Duration('');
    setShowApi2(false);
    setApi2ProductId('');
    setApi2Duration('');
  };

  const handleDeletePlan = (planId: string, duration: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    triggerToast(`Plan "${duration}" removed.`);
  };

  const handleStartEditPlan = (plan: PlanPricing) => {
    setEditingPlanId(plan.id);
    setEditPlanDuration(plan.duration);
    setEditPlanPrice(plan.price.toString());
    setEditPlanResellerPrice(plan.resellerPrice ? plan.resellerPrice.toString() : '');
  };

  const handleSaveEditPlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              duration: editPlanDuration.trim() || p.duration,
              price: parseFloat(editPlanPrice) || p.price,
              resellerPrice: editPlanResellerPrice ? parseFloat(editPlanResellerPrice) : undefined,
            }
          : p
      )
    );
    setEditingPlanId(null);
    triggerToast('Plan updated successfully.');
  };

  const handleSaveAllChanges = () => {
    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    // If user typed into the Add Plan input fields but did not click "+ Add Plan" button before saving, auto-include it!
    let effectivePlans = [...plans];
    if (planDuration.trim() && planPrice.trim()) {
      const autoPlanId = `plan-${Date.now()}`;
      effectivePlans.push({
        id: autoPlanId,
        duration: planDuration.trim(),
        price: parseFloat(planPrice) || 0,
        resellerPrice: planResellerPrice ? parseFloat(planResellerPrice) : undefined,
      });
      if (planKeysText.trim()) {
        planKeysMap[autoPlanId] = planKeysText.trim();
      }
    }

    // Collect all keys and format planKeys
    const planKeysFormatted: Record<string, string[]> = {};
    const allKeysList: string[] = [];

    Object.entries(planKeysMap).forEach(([planId, text]) => {
      const splitKeys = (text || '')
        .split('\n')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      planKeysFormatted[planId] = splitKeys;
      allKeysList.push(...splitKeys);
    });

    const finalPlans = (effectivePlans.length > 0 ? effectivePlans : [{ id: `plan-default-${Date.now()}`, duration: '1 Day', price: 50 }]).map((p) => {
      const count = planKeysFormatted[p.id]?.length || (p.keysCount || 0);
      return {
        ...p,
        keysCount: count,
      };
    });

    const finalProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      game: game || 'FREEFIRE',
      deviceType: deviceType || 'ROOT + NONROOT',
      category: category || 'All Products',
      stock: allKeysList.length || (editingProduct ? editingProduct.stock : 0),
      status: editingProduct ? editingProduct.status : 'ACTIVE',
      channelLink: channelLink.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      description: editingProduct?.description,
      plans: finalPlans,
      planKeys: planKeysFormatted,
      keys: allKeysList,
      api1Restock:
        showApi1 && api1ProductId
          ? {
              remoteProductId: api1ProductId,
              remoteDuration: api1Duration || '1',
            }
          : editingProduct?.api1Restock,
      api2Restock:
        showApi2 && api2ProductId
          ? {
              remoteProductId: api2ProductId,
              remoteDuration: api2Duration || '1',
            }
          : editingProduct?.api2Restock,
    };

    onSaveProduct(finalProduct);
    onClose();
  };

  const ytEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-50 w-full max-w-lg max-h-[92vh] bg-[#161226] border border-purple-500/20 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 overflow-y-auto shadow-[0_0_50px_rgba(112,26,179,0.35)] text-white text-xs"
          >
            {/* Top Toast Banner inside Modal (Exact matching video style) */}
            <AnimatePresence>
              {planToast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{planToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-bold text-sm">
                  {editingProduct ? '✏️ Edit Product' : '➕ Add Product'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Meta Form */}
            <div className="mt-3.5 space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-gray-300 font-bold mb-1 text-[11px]">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Drip client or Bala mods"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-medium text-xs transition-colors"
                />
              </div>

              {/* Game & Device Type row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1 text-[11px]">
                    Target Game
                  </label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    <option value="FREEFIRE">🔥 Free Fire</option>
                    <option value="8 BAAL POOL">🎱 8 Ball Pool</option>
                    <option value="BGMI / PUBG">🎯 BGMI / PUBG</option>
                    <option value="ALL GAMES">🌐 All Games</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1 text-[11px]">
                    Device Support
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    <option value="ROOT + NONROOT">📱 Root + Non-Root</option>
                    <option value="NON-ROOT">📱 Non-Root</option>
                    <option value="ROOT">⚡ Root Only</option>
                    <option value="IOS">🍎 iOS / iPhone</option>
                    <option value="ALL Systems">💻 All Systems</option>
                  </select>
                </div>
              </div>

              {/* Device Category (optional) */}
              <div>
                <label className="block text-gray-300 font-bold mb-1 text-[11px]">
                  Device Category (optional)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  <option value="Non-Root Mobile">📱 Non-Root Mobile</option>
                  <option value="Root Mobile">📱 Root Mobile</option>
                  <option value="PC / Emulator">💻 PC / Emulator</option>
                  <option value="iOS / iPhone">🍎 iOS / iPhone</option>
                  <option value="All Products">🌐 All Products</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Leave unchosen and this product shows under &quot;All Products&quot; instead of a specific device type.
                </p>
              </div>

              {/* ==================== PRODUCT PHOTO / MANUAL ADD ==================== */}
              <div className="p-3.5 rounded-2xl bg-[#0e0a1b]/90 border border-purple-500/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <label className="block text-white font-bold text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                      <ImageIcon className="w-3 h-3" />
                    </div>
                    <span>Product Photo / Cover Image (Manual Add)</span>
                  </label>
                  {imageUrl.trim() && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                      Photo Added
                    </span>
                  )}
                </div>

                {/* Sub-tabs: Upload File vs Image Link vs Presets */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageInputMode === 'upload'
                        ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Device / Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageInputMode === 'url'
                        ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Image URL Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('presets')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      imageInputMode === 'presets'
                        ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>VIP Presets</span>
                  </button>
                </div>

                {/* Option 1: File Upload (Drag & Drop or Picker) */}
                {imageInputMode === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={handleDropImage}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDraggingImage
                        ? 'border-purple-400 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'border-purple-500/30 bg-black/30 hover:border-purple-400/70 hover:bg-purple-950/20'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white">
                        Click to select photo or drag &amp; drop
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Supports PNG, JPG, WEBP, GIF (auto-resized &amp; optimized)
                      </p>
                    </div>
                  </div>
                )}

                {/* Option 2: Image URL Input */}
                {imageInputMode === 'url' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/images/freefire-vip.png"
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-black/60 border border-purple-500/40 focus:border-purple-400 focus:outline-none text-white font-mono text-xs transition-colors"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Enter any direct public image link (Imgur, Discord CDN, Unsplash, Cloudinary, etc.)
                    </p>
                  </div>
                )}

                {/* Option 3: Curated Presets */}
                {imageInputMode === 'presets' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          triggerToast(`Selected "${preset.name}" preset photo!`);
                        }}
                        className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                          imageUrl === preset.url
                            ? 'border-purple-400 ring-2 ring-purple-500/50 bg-purple-950/40'
                            : 'border-white/10 hover:border-purple-400/50 bg-black/40'
                        }`}
                      >
                        <div className="aspect-video w-full rounded-lg overflow-hidden relative bg-black">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {imageUrl === preset.url && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 block mt-1 truncate">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Helper: Grab Photo from YouTube URL */}
                {videoUrl.trim() && isYouTubeUrl(videoUrl) && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-red-950/20 border border-red-500/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-red-400" />
                      <span className="text-[11px] text-gray-300">
                        YouTube video detected. Use video thumbnail?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseYouTubeThumbnail}
                      className="px-2.5 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>Grab HD Thumbnail</span>
                    </button>
                  </div>
                )}

                {/* Live Photo Preview Card */}
                {imageUrl.trim() && (
                  <div className="p-2.5 rounded-xl bg-black/70 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        <span>Live Photo Preview</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-purple-300 hover:text-white font-bold underline cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10 shadow-md">
                      <img
                        src={imageUrl}
                        alt="Product Photo Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => triggerToast('Failed to load image preview. Please check image URL.')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Video / YouTube URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-300 font-bold text-[11px] flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    <span>Product Video / YouTube URL</span>
                  </label>
                  {videoUrl.trim() && (
                    <div className="flex items-center gap-1.5">
                      {ytEmbedUrl ? (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-emerald-400" />
                          YouTube Embed Ready
                        </span>
                      ) : (
                        <span className="text-[9px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          External Link
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsPreviewingVideo(!isPreviewingVideo)}
                        className="text-[10px] text-purple-300 hover:text-purple-200 font-bold underline cursor-pointer"
                      >
                        {isPreviewingVideo ? 'Hide Player' : 'Preview Video'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-mono text-xs transition-colors"
                  />
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Inline YouTube Player Preview */}
                {isPreviewingVideo && (
                  <div className="mt-2 p-2 rounded-2xl bg-black/80 border border-red-500/40 space-y-2">
                    {ytEmbedUrl ? (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={ytEmbedUrl}
                          title="Product Video Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400">
                        <p className="text-rose-400 font-bold mb-1">Non-YouTube Video Link</p>
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 underline inline-flex items-center gap-1"
                        >
                          <span>Open external video link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Channel Link */}
              <div>
                <label className="block text-gray-300 font-bold mb-1 text-[11px] flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>Channel Link (key ke sath customer ko jayega)</span>
                </label>
                <input
                  type="text"
                  value={channelLink}
                  onChange={(e) => setChannelLink(e.target.value)}
                  placeholder="e.g. https://t.me/yourchannel"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0a1b] border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-mono text-xs transition-colors"
                />
              </div>

              {/* Save Changes Button for Top Form */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleSaveAllChanges}
                className="w-full py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-bold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all border border-purple-400/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </motion.button>
            </div>

            {/* ==================== PLANS SECTION (Matching video) ==================== */}
            <div className="mt-5 pt-4 border-t border-purple-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  Plans
                </span>
              </div>

              {/* List of Existing Plans */}
              {plans.length > 0 && (
                <div className="space-y-2">
                  {plans.map((plan) => {
                    const isEditing = editingPlanId === plan.id;
                    const isKeysOpen = openKeyViewerPlanId === plan.id;
                    const planStockCount = (planKeysMap[plan.id] || '')
                      .split('\n')
                      .filter((k) => k.trim().length > 0).length;

                    return (
                      <div
                        key={plan.id}
                        className="p-3 rounded-xl bg-[#0e0a1b] border border-purple-500/30 space-y-2"
                      >
                        {isEditing ? (
                          /* Inline Edit Mode */
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Duration</label>
                                <input
                                  type="text"
                                  value={editPlanDuration}
                                  onChange={(e) => setEditPlanDuration(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-purple-400 text-white text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Price (₹)</label>
                                <input
                                  type="number"
                                  value={editPlanPrice}
                                  onChange={(e) => setEditPlanPrice(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-purple-400 text-white text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-yellow-400 block mb-0.5">👑 Reseller Price (₹)</label>
                              <input
                                type="number"
                                value={editPlanResellerPrice}
                                onChange={(e) => setEditPlanResellerPrice(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-yellow-500/30 text-yellow-300 text-xs font-bold"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingPlanId(null)}
                                className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-[11px]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditPlan(plan.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                              >
                                Save Plan
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Normal Plan Display (Exact video style) */
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-white text-xs">
                                {plan.duration} — ₹{plan.price.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {planStockCount} key(s)
                                {plan.resellerPrice ? (
                                  <span className="text-yellow-400 ml-1">
                                    • 👑 Reseller: ₹{plan.resellerPrice}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditPlan(plan)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 text-[11px] font-semibold cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlan(plan.id, plan.duration)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/40 text-rose-400 text-[11px] font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Collapsible: Add / View Keys (0 in stock) */}
                        <div className="pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenKeyViewerPlanId(isKeysOpen ? null : plan.id)
                            }
                            className="w-full flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 hover:text-white cursor-pointer py-0.5"
                          >
                            {isKeysOpen ? (
                              <ChevronDown className="w-3 h-3 text-purple-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-purple-400" />
                            )}
                            <Key className="w-3 h-3 text-cyan-400" />
                            <span>
                              {plan.duration} — Add / View Keys ({planStockCount} in stock)
                            </span>
                          </button>

                          {isKeysOpen && (
                            <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-black/50 border border-white/5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] text-gray-400 block">
                                  Keys for {plan.duration} (one per line):
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const generated = generateRandomLicenseKeys(10, 'KALAM-VIP');
                                    const existing = planKeysMap[plan.id] || '';
                                    const combined = existing.trim() ? `${existing.trim()}\n${generated.join('\n')}` : generated.join('\n');
                                    setPlanKeysMap((prev) => ({
                                      ...prev,
                                      [plan.id]: combined,
                                    }));
                                    triggerToast(`Added 10 auto-generated keys for "${plan.duration}"`);
                                  }}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>+ Auto Generate 10 Keys</span>
                                </button>
                              </div>
                              <textarea
                                rows={3}
                                value={planKeysMap[plan.id] || ''}
                                onChange={(e) =>
                                  setPlanKeysMap((prev) => ({
                                    ...prev,
                                    [plan.id]: e.target.value,
                                  }))
                                }
                                placeholder={"KEY-0001\nKEY-0002"}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0a1b] border border-white/10 focus:border-purple-400 text-white font-mono text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  triggerToast(`Keys updated for "${plan.duration}".`);
                                  setOpenKeyViewerPlanId(null);
                                }}
                                className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Save Keys for {plan.duration}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Save Changes (all plans) Button */}
                  <button
                    type="button"
                    onClick={handleSaveAllChanges}
                    className="w-full py-2 rounded-xl bg-[#581c87] hover:bg-[#6b21a8] border border-purple-400/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes (all plans)</span>
                  </button>
                </div>
              )}

              {/* ==================== ➕ ADD PLAN FORM (Exact matching video) ==================== */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#0e0a1b] border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add Plan</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Duration input */}
                  <div>
                    <input
                      type="text"
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                      placeholder="e.g. 1 Day / 3 Days"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white text-xs font-medium placeholder:text-gray-500"
                    />
                  </div>

                  {/* Price input */}
                  <div>
                    <input
                      type="number"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      placeholder="Price (₹)"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white text-xs font-bold placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Reseller Price (optional) */}
                <div>
                  <div className="relative">
                    <Crown className="w-3.5 h-3.5 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={planResellerPrice}
                      onChange={(e) => setPlanResellerPrice(e.target.value)}
                      placeholder="👑 Reseller Price (₹, optional)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-yellow-500/20 focus:border-yellow-400 focus:outline-none text-yellow-300 text-xs font-medium placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Keys Textarea with quick generate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">Plan Keys (optional):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateRandomLicenseKeys(10, 'KALAM-VIP');
                        const combined = planKeysText.trim() ? `${planKeysText.trim()}\n${generated.join('\n')}` : generated.join('\n');
                        setPlanKeysText(combined);
                        triggerToast('Added 10 auto-generated VIP keys.');
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>+ Auto Generate 10 Keys</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={planKeysText}
                    onChange={(e) => setPlanKeysText(e.target.value)}
                    placeholder={"Keys — one per line (optional)\nKEY-0001\nKEY-0002"}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-purple-400 focus:outline-none text-white font-mono text-xs placeholder:text-gray-600"
                  />
                </div>

                {/* Collapsible: API #1 Auto-Restock */}
                <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowApi1(!showApi1)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
                      {showApi1 ? (
                        <ChevronDown className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-cyan-400" />
                      )}
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>API #1 Auto-Restock (optional)</span>
                    </div>
                  </button>

                  {showApi1 && (
                    <div className="p-2.5 border-t border-white/5 space-y-2 bg-[#161226]/60">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Remote Product ID</label>
                          <input
                            type="text"
                            value={api1ProductId}
                            onChange={(e) => setApi1ProductId(e.target.value)}
                            placeholder="e.g. PID_123"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Remote Duration</label>
                          <input
                            type="text"
                            value={api1Duration}
                            onChange={(e) => setApi1Duration(e.target.value)}
                            placeholder="e.g. 1 Day"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible: API #2 Auto-Restock — HK MODZ */}
                <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowApi2(!showApi2)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
                      {showApi2 ? (
                        <ChevronDown className="w-3 h-3 text-purple-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-purple-400" />
                      )}
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>API #2 Auto-Restock — HK MODZ (optional)</span>
                    </div>
                  </button>

                  {showApi2 && (
                    <div className="p-2.5 border-t border-white/5 space-y-2 bg-[#161226]/60">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Remote Product ID</label>
                          <input
                            type="text"
                            value={api2ProductId}
                            onChange={(e) => setApi2ProductId(e.target.value)}
                            placeholder="e.g. PID_123"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-purple-400 text-white font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Remote Duration</label>
                          <input
                            type="text"
                            value={api2Duration}
                            onChange={(e) => setApi2Duration(e.target.value)}
                            placeholder="e.g. 1 Day"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-purple-400 text-white font-mono text-[11px] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Plan Big Purple Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleAddNewPlan}
                  className="w-full py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-extrabold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-purple-400/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Plan</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
