import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  Copy,
  Check,
  Send,
  Globe,
  Bot,
  Layers,
  Clock,
  Volume2,
  Tv,
  Share2,
  RefreshCw,
  Flame,
  MessageSquare,
  Hash,
  Lightbulb,
  ExternalLink,
  Gamepad2,
  Play
} from 'lucide-react';

interface SceneScript {
  sceneNumber: number;
  timeRange: string;
  title: string;
  visualHookTamil: string;
  visualHookEnglish: string;
  onScreenTextTamil: string;
  onScreenTextEnglish: string;
  voiceoverScriptTamil: string;
  voiceoverScriptEnglish: string;
  pacingNote: string;
}

interface ReelsGenerationResult {
  reelTopic: string;
  targetAudience: string;
  scenes: SceneScript[];
  aiVideoPrompt: string;
  aiVoiceoverPromptTamil: string;
  aiVoiceoverPromptEnglish: string;
  instagramCaptionTamil: string;
  instagramCaptionEnglish: string;
  hashtags: string[];
  tips: string[];
}

export const ReelsMarketingStudio: React.FC = () => {
  // Input form state
  const [websiteName, setWebsiteName] = useState('KALAM FF PANEL');
  const [websiteUrl, setWebsiteUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://kalamffpanel.com');
  const [botUsername, setBotUsername] = useState('@kalam_store_bot');
  const [productFocus, setProductFocus] = useState('Free Fire Keys & VIP Injectors');
  const [botFeatures, setBotFeatures] = useState('Instant 2-second key delivery, UPI wallet balance, 24/7 automated bot, zero waiting time');
  const [targetAudience, setTargetAudience] = useState('Tamil Free Fire gamers, tournament players & digital resellers');
  const [tone, setTone] = useState('High-energy gaming influencer style');
  const [customNotes, setCustomNotes] = useState('');

  // Execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tamil' | 'english' | 'ai_prompts' | 'captions'>('tamil');

  // Initial generated result state
  const [result, setResult] = useState<ReelsGenerationResult | null>(null);
  const [generationSource, setGenerationSource] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/reels/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteName,
          websiteUrl,
          botUsername,
          botFeatures,
          productFocus,
          targetAudience,
          tone,
          customNotes
        })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setResult(data.data);
        setGenerationSource(data.source || 'gemini-ai');
      }
    } catch (err) {
      console.error('Failed to generate reels script:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" id="reels-marketing-studio-container">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1b0d36] via-[#120e26] to-[#0a1226] border border-pink-500/40 shadow-[0_0_25px_rgba(255,0,128,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,128,0.4)] shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Instagram Reels Script Studio (30s Tamil Generator)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold">
                10s + 10s + 10s Split
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Input your Store & Telegram Bot details to generate viral 30-second Tamil Reels scripts, AI video & voice prompts, and ready-to-post captions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,128,0.35)] cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Script...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate 30s Reels Script</span>
            </>
          )}
        </button>
      </div>

      {/* Input Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#12121e] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Layers className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Marketing Target & Store Details
              </h3>
            </div>

            {/* Website Name & URL */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Website / Panel Name
                </label>
                <input
                  type="text"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  placeholder="e.g. KALAM FF PANEL"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Website URL (To promote in Bio / CTA)
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Bot Username */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  Telegram Bot Username
                </label>
                <input
                  type="text"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  placeholder="@kalam_store_bot"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-purple-300 font-mono focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Product Focus */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  Product / Key Focus
                </label>
                <input
                  type="text"
                  value={productFocus}
                  onChange={(e) => setProductFocus(e.target.value)}
                  placeholder="e.g. Free Fire Keys, VIP Injectors, Panel Access"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Bot & Web Features */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Key Features & USPs
                </label>
                <textarea
                  rows={2}
                  value={botFeatures}
                  onChange={(e) => setBotFeatures(e.target.value)}
                  placeholder="Instant 2-second key delivery, UPI wallet balance, 24/7 automated bot..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Tamil Free Fire gamers, tournament players..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  Video Tone & Energy
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                >
                  <option value="High-energy gaming influencer style">High-energy gaming influencer style</option>
                  <option value="Urgent / Limited Deal promotional tone">Urgent / Limited Deal promotional tone</option>
                  <option value="Curious / Secret Method hook">Curious / Secret Method hook</option>
                  <option value="Step-by-step fast tutorial tone">Step-by-step fast tutorial tone</option>
                </select>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Mention instant UPI QR payment and discount coupon"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,128,0.25)] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating 30s Script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Script in Tamil</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Viewer */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isGenerating && (
            <div className="p-8 rounded-2xl bg-[#12121e] border border-white/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[420px]">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(255,0,128,0.15)]">
                <Video className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">No Script Generated Yet</h4>
              <p className="text-xs text-gray-400 max-w-md">
                Click <strong>"Generate 30s Reels Script"</strong> to create a timed 3-scene breakdown (0-10s, 10-20s, 20-30s) in Tamil with AI video prompts and caption copies.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Load Ready-Made Script</span>
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="p-8 rounded-2xl bg-[#12121e] border border-pink-500/30 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 animate-pulse shadow-[0_0_25px_rgba(255,0,128,0.3)]">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Crafting 30s Tamil Reels Scenes...</h4>
                <p className="text-xs text-gray-400">
                  Structuring 10-second scene cuts, viral hooks, spoken Tamil voiceover, and video generator prompts.
                </p>
              </div>
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-4">
              {/* Output Tab Switcher */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tamil')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'tamil'
                        ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(255,0,128,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🎬 30s Tamil Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('english')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'english'
                        ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🇬🇧 English Translation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai_prompts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'ai_prompts'
                        ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🤖 AI Video & Voice Prompts
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('captions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'captions'
                        ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📱 Instagram Caption
                  </button>
                </div>

                {generationSource && (
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    Generated via {generationSource}
                  </span>
                )}
              </div>

              {/* Tab 1: Tamil 3-Scene Breakdown (10s + 10s + 10s) */}
              {activeTab === 'tamil' && (
                <div className="space-y-3.5">
                  {result.scenes.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#12121e] border border-pink-500/30 shadow-[0_0_15px_rgba(255,0,128,0.06)] space-y-3"
                    >
                      {/* Scene Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 font-mono font-bold text-xs flex items-center justify-center border border-pink-500/30">
                            {sc.sceneNumber}
                          </span>
                          <span className="text-xs font-black text-white">{sc.title}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sc.timeRange}
                        </span>
                      </div>

                      {/* Visual & On-Screen Text */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Tv className="w-3 h-3 text-cyan-400" />
                            Visual Hook (காட்சி)
                          </span>
                          <p className="text-gray-200 leading-relaxed">{sc.visualHookTamil}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            On-Screen Text (திரை உரை)
                          </span>
                          <p className="text-pink-300 font-bold leading-relaxed">{sc.onScreenTextTamil}</p>
                        </div>
                      </div>

                      {/* Tamil Voiceover */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-pink-400" />
                            Tamil Spoken Dialogue (குரல் பதிவு - தமிழ்)
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(sc.voiceoverScriptTamil, `vo_ta_${idx}`)}
                            className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedKey === `vo_ta_${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Scene Dialogue</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-white leading-relaxed font-medium">
                          "{sc.voiceoverScriptTamil}"
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Complete Continuous Voiceover Script for ElevenLabs */}
                  <div className="p-4 rounded-2xl bg-[#161324] border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Full 30-Second Tamil Voiceover (ElevenLabs Ready)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.aiVoiceoverPromptTamil, 'full_ta')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'full_ta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'full_ta' ? 'Copied Full Script' : 'Copy All Tamil VO'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {result.aiVoiceoverPromptTamil}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 2: English Script */}
              {activeTab === 'english' && (
                <div className="space-y-3.5">
                  {result.scenes.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#12121e] border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.06)] space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30">
                            {sc.sceneNumber}
                          </span>
                          <span className="text-xs font-black text-white">{sc.title}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sc.timeRange}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Tv className="w-3 h-3 text-cyan-400" />
                            Visual Hook
                          </span>
                          <p className="text-gray-200 leading-relaxed">{sc.visualHookEnglish}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            On-Screen Text
                          </span>
                          <p className="text-purple-300 font-bold leading-relaxed">{sc.onScreenTextEnglish}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-purple-400" />
                            English Spoken Dialogue
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(sc.voiceoverScriptEnglish, `vo_en_${idx}`)}
                            className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedKey === `vo_en_${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Dialogue</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-white leading-relaxed font-medium">
                          "{sc.voiceoverScriptEnglish}"
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 rounded-2xl bg-[#161324] border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Full 30-Second English Voiceover Script
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.aiVoiceoverPromptEnglish, 'full_en')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'full_en' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'full_en' ? 'Copied Full Script' : 'Copy All English VO'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {result.aiVoiceoverPromptEnglish}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 3: AI Video Generator Prompts */}
              {activeTab === 'ai_prompts' && (
                <div className="space-y-4">
                  {/* AI Video Avatar Prompt */}
                  <div className="p-4 rounded-2xl bg-[#12121e] border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          AI Video Avatar Prompt (HeyGen / Kling / Runway / D-ID)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.aiVideoPrompt, 'video_prompt')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'video_prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'video_prompt' ? 'Copied Prompt' : 'Copy Video Prompt'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Paste this into HeyGen, D-ID, Kling, or Midjourney/Runway to generate the visual avatar video:
                    </p>
                    <pre className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-cyan-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {result.aiVideoPrompt}
                    </pre>
                  </div>

                  {/* Production Tips */}
                  {result.tips && result.tips.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#12121e] border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Reels Viral Optimization Checklist
                        </h4>
                      </div>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Instagram Caption & Hashtags */}
              {activeTab === 'captions' && (
                <div className="space-y-4">
                  {/* Tamil Caption */}
                  <div className="p-4 rounded-2xl bg-[#12121e] border border-pink-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Ready-to-Post Tamil Caption
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(result.instagramCaptionTamil, 'cap_ta')}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-xs font-bold text-pink-300 border border-pink-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'cap_ta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'cap_ta' ? 'Copied Caption' : 'Copy Tamil Caption'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {result.instagramCaptionTamil}
                    </pre>
                  </div>

                  {/* Hashtags */}
                  {result.hashtags && result.hashtags.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#12121e] border border-blue-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Targeted Gaming Hashtags
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.hashtags.join(' '), 'hash')}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-300 border border-blue-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedKey === 'hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'hash' ? 'Copied Hashtags' : 'Copy All Tags'}</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtags.map((h, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono font-medium"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReelsMarketingStudio;
