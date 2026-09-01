import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Check,
  Edit,
  Pause,
  Play,
  Wrench,
  Trash2,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { Product } from '../../types';
import { getYouTubeThumbnailUrl, isYouTubeUrl, getYouTubeEmbedUrl } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onToggleSelect?: (productId: string) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onToggleMaintenance: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onToggleStatus,
  onToggleMaintenance,
  onDelete,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const isAvailable = product.status === 'ACTIVE';
  const isMaintenance = product.status === 'MAINTENANCE';

  // Determine media cover: manual image has priority, then YouTube video thumbnail
  const displayImage = product.imageUrl || (product.videoUrl && isYouTubeUrl(product.videoUrl) ? getYouTubeThumbnailUrl(product.videoUrl, 'hq') : null);
  const hasYouTube = Boolean(product.videoUrl && isYouTubeUrl(product.videoUrl));
  const ytEmbedUrl = product.videoUrl ? getYouTubeEmbedUrl(product.videoUrl) : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    onDelete(product.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(false);
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl transition-all space-y-3.5 ${
          isSelected
            ? 'bg-[#1b1535] border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.35)]'
            : 'bg-[#141026] border border-purple-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Top row: Checkbox / Selection + Yellow menu icon + Category Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Bulk Selection Checkbox */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(product.id);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#a855f7] text-white border-2 border-[#c084fc] shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                    : 'bg-white/5 hover:bg-white/10 text-transparent border border-white/20 hover:border-purple-400/50'
                }`}
                title={isSelected ? 'Deselect product' : 'Select product for bulk action'}
              >
                <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'text-white opacity-100' : 'opacity-0'}`} />
              </button>
            )}

            {/* Yellow square icon with 3 horizontal lines */}
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
              <Menu className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Category badge with checkmark (e.g. NON-ROOT MOBILE) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
            <span>{product.category || 'NON-ROOT MOBILE'}</span>
          </div>
        </div>

        {/* Product Photo / Media Banner Preview if exists */}
        {displayImage && (
          <div
            onClick={() => setShowMediaModal(true)}
            className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-purple-500/20 group cursor-pointer shadow-inner"
          >
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
              <div className="flex items-center gap-1.5">
                {product.imageUrl && (
                  <span className="text-[9px] font-bold bg-pink-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                    <ImageIcon className="w-2.5 h-2.5" />
                    Photo
                  </span>
                )}
                {hasYouTube && (
                  <span className="text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                    <Play className="w-2.5 h-2.5 fill-white" />
                    YouTube
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/90 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-3 h-3" />
                View Media
              </span>
            </div>
          </div>
        )}

        {/* Middle row: PRODUCT Name on left, STOCK and ACTIVE status on right */}
        <div className="flex items-end justify-between pt-1">
          {/* Left: Product Name */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              PRODUCT
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {product.name}
            </h3>
          </div>

          {/* Right: Stock Count and Status */}
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              STOCK
            </span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-white">
                {product.stock} key(s)
              </span>

              {/* Status dot & text */}
              {isAvailable && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE
                </span>
              )}
              {product.status === 'DISABLED' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  DISABLED
                </span>
              )}
              {isMaintenance && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" />
                  MAINTENANCE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: 2x2 grid matching video exactly */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          {/* Row 1: Edit & Disable / Enable */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(product)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#231e3d] hover:bg-[#2c264d] border border-purple-500/30 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Edit className="w-3.5 h-3.5 text-gray-300" />
              <span>Edit</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleStatus(product)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                product.status === 'ACTIVE'
                  ? 'bg-amber-950/50 hover:bg-amber-950/70 border-amber-600/50 text-amber-300'
                  : 'bg-emerald-950/50 hover:bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
              }`}
            >
              {product.status === 'ACTIVE' ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enable</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Row 2: Maintenance & Delete */}
          {confirmingDelete ? (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelDelete}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-3.5 h-3.5 text-gray-300" />
                <span>Cancel</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteClick}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 border border-red-400 text-white text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                <span>Yes, Delete!</span>
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleMaintenance(product)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                  isMaintenance
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                    : 'bg-[#231e3d] hover:bg-[#2c264d] border-purple-500/30 text-gray-300 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-gray-400" />
                <span>Maintenance</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteClick}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-800/40 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Modal for Admin */}
      <AnimatePresence>
        {showMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#141026] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{product.name}</h3>
                    <span className="text-[10px] text-gray-400">Photo &amp; Video Media</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Preview */}
              {product.imageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Product Photo</span>
                  </span>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* YouTube Video Preview */}
              {ytEmbedUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-red-400" />
                    <span>YouTube Video</span>
                  </span>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-red-500/40 shadow-lg">
                    <iframe
                      src={ytEmbedUrl}
                      title={`${product.name} Video`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-lg"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
