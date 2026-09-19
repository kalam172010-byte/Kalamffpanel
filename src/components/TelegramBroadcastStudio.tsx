import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserCheck,
  Radio,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  UploadCloud,
  FileAudio,
  Eye,
  History,
  Check,
  Copy,
  ExternalLink,
  Crown
} from 'lucide-react';

export interface TelegramBroadcastStudioProps {
  className?: string;
  onBroadcastComplete?: (result: any) => void;
}

interface BotUserSummary {
  chatId: number;
  userId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  isReseller?: boolean;
  role?: string;
}

interface BroadcastHistoryItem {
  broadcastId: string;
  timestamp: string;
  type: 'text' | 'photo' | 'voice' | 'audio';
  targetLabel: string;
  total: number;
  sent: number;
  failed: number;
  textSnippet: string;
  hasButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  status: string;
}

export const TelegramBroadcastStudio: React.FC<TelegramBroadcastStudioProps> = ({
  className = '',
  onBroadcastComplete
}) => {
  // Tabs: 'text' | 'photo' | 'song' | 'voice'
  const [activeTab, setActiveTab] = useState<'text' | 'photo' | 'song' | 'voice'>('text');

  // Target selection: 'all' | 'resellers' | 'specific' | 'channel'
  const [targetType, setTargetType] = useState<'all' | 'resellers' | 'specific' | 'channel'>('all');
  const [specificTarget, setSpecificTarget] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [botUsers, setBotUsers] = useState<BotUserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Text Broadcast State
  const [messageText, setMessageText] = useState<string>('');

  // Photo Broadcast State
  const [photoMode, setPhotoMode] = useState<'file' | 'url'>('file');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Song & Music Track State
  const [songTitle, setSongTitle] = useState<string>('KALAM FF VIP Track');
  const [songArtist, setSongArtist] = useState<string>('KALAM FF Official');
  const [songCaption, setSongCaption] = useState<string>('🔥 Exclusive Audio Track Release from KALAM FF Store!');
  const [songBase64, setSongBase64] = useState<string>('');
  const [songUrl, setSongUrl] = useState<string>('');
  const [songMode, setSongMode] = useState<'file' | 'url'>('file');
  const [songDuration, setSongDuration] = useState<number>(0);
  const [songFileName, setSongFileName] = useState<string>('');
  const [songPreviewUrl, setSongPreviewUrl] = useState<string | null>(null);
  const songFileInputRef = useRef<HTMLInputElement>(null);
  const songAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Voice Broadcast State
  const [voiceMode, setVoiceMode] = useState<'record' | 'file' | 'url'>('record');
  const [voiceUrl, setVoiceUrl] = useState<string>('');
  const [voiceBase64, setVoiceBase64] = useState<string>('');
  const [voiceCaption, setVoiceCaption] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Action Button State
  const [enableButton, setEnableButton] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>('⚡ Grab VIP Keys');
  const [buttonUrl, setButtonUrl] = useState<string>('https://t.me/kalamffpanel');

  // Execution & Progress State
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [broadcastProgress, setBroadcastProgress] = useState<{ sent: number; total: number; percent: number } | null>(null);
  const [recentHistory, setRecentHistory] = useState<BroadcastHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Bot Users and Broadcast History
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/telegram/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setBotUsers(data.users);
        }
      }
    } catch {}
    finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/telegram/broadcast-history');
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setRecentHistory(data.history);
        }
      }
    } catch {}
    finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, [fetchUsers, fetchHistory]);

  // Recipient Count Calculation
  const getRecipientCount = (): number => {
    if (targetType === 'all') return botUsers.length || 1;
    if (targetType === 'resellers') return botUsers.filter(u => u.isReseller || u.role === 'RESELLER' || u.role === 'ADMIN').length || 1;
    if (targetType === 'channel') return 1;
    return 1;
  };

  // Template Quick Inserters
  const applyTemplate = (template: string) => {
    if (activeTab === 'text') {
      setMessageText(template);
    } else if (activeTab === 'photo') {
      setPhotoCaption(template);
    } else if (activeTab === 'song') {
      setSongCaption(template);
    } else {
      setVoiceCaption(template);
    }
  };

  const insertHtmlTag = (tag: string) => {
    const startTag = `<${tag}>`;
    const endTag = `</${tag}>`;
    if (activeTab === 'text') {
      setMessageText(prev => `${prev} ${startTag}text${endTag}`);
    } else if (activeTab === 'photo') {
      setPhotoCaption(prev => `${prev} ${startTag}text${endTag}`);
    } else if (activeTab === 'song') {
      setSongCaption(prev => `${prev} ${startTag}text${endTag}`);
    } else {
      setVoiceCaption(prev => `${prev} ${startTag}text${endTag}`);
    }
  };

  // Image Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ text: 'Please select a valid image file (PNG, JPG, WEBP).', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPhotoBase64(b64);
      setPhotoPreview(b64);
      setStatusMessage({ text: `Image selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert blob to base64 for transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setStatusMessage({ text: 'Microphone permission denied or not supported in this browser.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const resetRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setVoiceBase64('');
    setRecordingSeconds(0);
    setIsPlayingPreview(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  // Song & Audio Track Upload Handler
  const handleSongUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSongFileName(file.name);
    // Auto-fill title from filename
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!songTitle || songTitle === 'KALAM FF VIP Track') {
      setSongTitle(cleanTitle);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSongBase64(b64);
      const url = URL.createObjectURL(file);
      setSongPreviewUrl(url);
      
      // Attempt to read audio duration
      const tempAudio = new Audio(url);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setSongDuration(Math.round(tempAudio.duration));
        }
      };

      setStatusMessage({ text: `🎵 Song loaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  const resetSong = () => {
    if (songPreviewUrl) {
      URL.revokeObjectURL(songPreviewUrl);
    }
    setSongPreviewUrl(null);
    setSongBase64('');
    setSongFileName('');
    setSongDuration(0);
    if (songFileInputRef.current) {
      songFileInputRef.current.value = '';
    }
  };

  // Audio File Upload Handler for Voice Tab
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setVoiceBase64(b64);
      setRecordedAudioUrl(URL.createObjectURL(file));
      setStatusMessage({ text: `Audio file loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  // Send Test Message to Admin
  const handleSendTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const payload: any = {
        type: activeTab === 'song' ? 'audio' : activeTab,
        buttonText: enableButton ? buttonText : undefined,
        buttonUrl: enableButton ? buttonUrl : undefined,
      };

      if (activeTab === 'text') {
        if (!messageText.trim()) {
          setStatusMessage({ text: 'Please enter message text before testing.', type: 'error' });
          setIsTesting(false);
          return;
        }
        payload.text = messageText.trim();
      } else if (activeTab === 'photo') {
        const photoSource = photoMode === 'file' ? photoBase64 : photoUrl.trim();
        if (!photoSource) {
          setStatusMessage({ text: 'Please choose an image file or enter an image URL.', type: 'error' });
          setIsTesting(false);
          return;
        }
        payload.photo = photoSource;
        payload.caption = photoCaption.trim() || undefined;
      } else if (activeTab === 'song') {
        const songSource = songMode === 'url' ? songUrl.trim() : songBase64;
        if (!songSource) {
          setStatusMessage({ text: 'Please upload a song/audio file or enter an audio URL.', type: 'error' });
          setIsTesting(false);
          return;
        }
        payload.audio = songSource;
        payload.title = songTitle.trim() || 'KALAM FF Audio Track';
        payload.performer = songArtist.trim() || 'KALAM FF Official';
        payload.caption = songCaption.trim() || undefined;
        payload.duration = songDuration || undefined;
        payload.fileName = songFileName || undefined;
      } else if (activeTab === 'voice') {
        const voiceSource = voiceMode === 'url' ? voiceUrl.trim() : voiceBase64;
        if (!voiceSource) {
          setStatusMessage({ text: 'Please record voice note or upload an audio file.', type: 'error' });
          setIsTesting(false);
          return;
        }
        payload.voice = voiceSource;
        payload.caption = voiceCaption.trim() || undefined;
        payload.duration = recordingSeconds || undefined;
      }

      const res = await fetch('/api/admin/telegram/test-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: `✅ Test ${activeTab === 'song' ? '🎵 Song' : activeTab} successfully sent to Admin Telegram! Check your phone.`, type: 'success' });
      } else {
        setStatusMessage({ text: `❌ Test send failed: ${data.error || 'Check Bot Token in Settings'}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Test Error: ${err.message}`, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  // Send Live Broadcast to All / Selected Users
  const handleExecuteBroadcast = async () => {
    const recipients = getRecipientCount();
    const typeLabel = activeTab === 'song' ? 'SONG / AUDIO TRACK' : activeTab.toUpperCase();
    const confirmMsg = targetType === 'all'
      ? `📢 Are you sure you want to broadcast this ${typeLabel} to ALL ${recipients} registered Telegram users?`
      : targetType === 'resellers'
      ? `👑 Confirm broadcast to ${recipients} VIP Resellers?`
      : targetType === 'channel'
      ? `📣 Confirm dispatch to Telegram Announcement Channel?`
      : `👤 Confirm direct dispatch to user "${specificTarget}"?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsSending(true);
    setStatusMessage(null);
    setBroadcastProgress({ sent: 0, total: recipients, percent: 0 });

    try {
      const payload: any = {
        type: activeTab === 'song' ? 'audio' : activeTab,
        target: targetType,
        targetChatId: targetType === 'specific' ? specificTarget.trim() : undefined,
        buttonText: enableButton ? buttonText.trim() : undefined,
        buttonUrl: enableButton ? buttonUrl.trim() : undefined,
      };

      if (activeTab === 'text') {
        if (!messageText.trim()) {
          setStatusMessage({ text: 'Message text cannot be empty.', type: 'error' });
          setIsSending(false);
          return;
        }
        payload.text = messageText.trim();
      } else if (activeTab === 'photo') {
        const photoSource = photoMode === 'file' ? photoBase64 : photoUrl.trim();
        if (!photoSource) {
          setStatusMessage({ text: 'Please select an image or provide a valid Photo URL.', type: 'error' });
          setIsSending(false);
          return;
        }
        payload.photo = photoSource;
        payload.caption = photoCaption.trim() || undefined;
      } else if (activeTab === 'song') {
        const songSource = songMode === 'url' ? songUrl.trim() : songBase64;
        if (!songSource) {
          setStatusMessage({ text: 'Please upload a song/audio file or enter an audio URL.', type: 'error' });
          setIsSending(false);
          return;
        }
        payload.audio = songSource;
        payload.title = songTitle.trim() || 'KALAM FF Audio Track';
        payload.performer = songArtist.trim() || 'KALAM FF Official';
        payload.caption = songCaption.trim() || undefined;
        payload.duration = songDuration || undefined;
        payload.fileName = songFileName || undefined;
      } else if (activeTab === 'voice') {
        const voiceSource = voiceMode === 'url' ? voiceUrl.trim() : voiceBase64;
        if (!voiceSource) {
          setStatusMessage({ text: 'Please record or select an audio file for voice broadcast.', type: 'error' });
          setIsSending(false);
          return;
        }
        payload.voice = voiceSource;
        payload.caption = voiceCaption.trim() || undefined;
        payload.duration = recordingSeconds || undefined;
      }

      const res = await fetch('/api/admin/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `🎉 Song / Broadcast Completed! Successfully delivered to ${data.sent} of ${data.total} recipients (${data.failed} failed).`,
          type: 'success'
        });
        fetchHistory();
        if (onBroadcastComplete) {
          onBroadcastComplete(data);
        }
      } else {
        setStatusMessage({ text: `❌ Broadcast failed: ${data.error}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Broadcast Error: ${err.message}`, type: 'error' });
    } finally {
      setIsSending(false);
      setBroadcastProgress(null);
    }
  };

  const filteredUsers = botUsers.filter(u => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      String(u.chatId).includes(q) ||
      (u.userId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-broadcast-studio" className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#ff0080]/15 to-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 rounded-xl bg-gradient-to-br from-[#ff0080] to-[#7c3aed] text-white shadow-[0_0_15px_rgba(255,0,128,0.5)]">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Telegram Broadcast & Media Dispatch Studio
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Instantly push formatted announcements, high-res photos, or direct audio voice messages to all registered bot users, VIP resellers, or connected channels.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
              <span className="text-gray-300 font-medium">Audience:</span>
              <span className="text-cyan-300 font-black font-mono">{botUsers.length} Users</span>
            </div>
            <button
              onClick={() => { fetchUsers(); fetchHistory(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Refresh User Count & History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Target Audience Selection */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>1. Select Target Audience</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {getRecipientCount()} Recipient(s)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-gradient-to-b from-[#ff0080]/20 to-[#7c3aed]/20 border-[#ff0080] text-white shadow-[0_0_12px_rgba(255,0,128,0.3)]'
                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-[#ff0080]" />
                <span>All Users</span>
                <span className="text-[9px] font-mono text-gray-400">{botUsers.length} total</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('resellers')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  targetType === 'resellers'
                    ? 'bg-gradient-to-b from-yellow-500/20 to-amber-600/20 border-yellow-500 text-white shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Crown className="w-4 h-4 text-yellow-400" />
                <span>Resellers</span>
                <span className="text-[9px] font-mono text-yellow-400/80">
                  {botUsers.filter(u => u.isReseller || u.role === 'RESELLER' || u.role === 'ADMIN').length} VIPs
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  targetType === 'specific'
                    ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Single User</span>
                <span className="text-[9px] font-mono text-cyan-400/80">Direct DM</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('channel')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  targetType === 'channel'
                    ? 'bg-gradient-to-b from-purple-500/20 to-indigo-600/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-black/40 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Channel</span>
                <span className="text-[9px] font-mono text-purple-400/80">Proofs / News</span>
              </button>
            </div>

            {/* Specific User Search & Input */}
            {targetType === 'specific' && (
              <div className="mt-3 p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2.5 animate-fadeIn">
                <label className="text-[11px] font-bold text-gray-300 block">
                  Select or Enter Telegram Chat ID / User ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specificTarget}
                    onChange={(e) => setSpecificTarget(e.target.value)}
                    placeholder="e.g. 7768975239, tg_7768975239, or @username"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0e0a1b] border border-cyan-500/40 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {botUsers.length > 0 && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="🔍 Filter user database..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-1 pt-1 pr-1">
                      {filteredUsers.slice(0, 8).map(u => (
                        <button
                          key={u.chatId}
                          type="button"
                          onClick={() => setSpecificTarget(String(u.chatId))}
                          className="w-full text-left px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-[11px] flex items-center justify-between transition-colors"
                        >
                          <span className="text-white font-medium truncate">
                            {u.firstName} {u.lastName || ''} {u.username ? `(@${u.username})` : ''}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px] shrink-0 ml-2">
                            ID: {u.chatId}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Media Type Selection Tabs */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff0080]" />
                <span>2. Choose Broadcast Content Type</span>
              </label>

              <div className="flex flex-wrap items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-gradient-to-r from-[#ff0080] to-[#7c3aed] text-white shadow-[0_0_10px_rgba(255,0,128,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'photo'
                      ? 'bg-gradient-to-r from-[#00e5ff] to-[#3b82f6] text-black font-extrabold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('song')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'song'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>🎵 Song / Music</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'voice'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>🎙️ Voice Note</span>
                </button>
              </div>
            </div>

            {/* Quick HTML Styling Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
              <span className="text-gray-400 font-semibold mr-1">Format:</span>
              <button
                type="button"
                onClick={() => insertHtmlTag('b')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold border border-white/5"
              >
                &lt;b&gt;Bold&lt;/b&gt;
              </button>
              <button
                type="button"
                onClick={() => insertHtmlTag('i')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 italic border border-white/5"
              >
                &lt;i&gt;Italic&lt;/i&gt;
              </button>
              <button
                type="button"
                onClick={() => insertHtmlTag('code')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 font-mono border border-white/5"
              >
                &lt;code&gt;
              </button>
              <button
                type="button"
                onClick={() => insertHtmlTag('blockquote')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-purple-300 border border-white/5"
              >
                &lt;quote&gt;
              </button>

              <div className="ml-auto flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">Templates:</span>
                <button
                  type="button"
                  onClick={() => applyTemplate('🔥 <b>KALAM FF PANEL — NEW VIP UPDATE!</b>\n\n⚡ Instant key restocked with 100% bypass.\n\n🛒 <i>Click the button below to buy your key now!</i>')}
                  className="px-2 py-0.5 rounded bg-[#ff0080]/15 hover:bg-[#ff0080]/30 text-[#ff0080] border border-[#ff0080]/30"
                >
                  Restock Alert
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('🎁 <b>WEEKEND 20% DISCOUNT IS LIVE!</b>\n\nUse code <code>KALAM20</code> on checkout to get 20% off all 1-Day & 7-Day keys!')}
                  className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                >
                  Promo Offer
                </button>
              </div>
            </div>

            {/* Content Form: TEXT MODE */}
            {activeTab === 'text' && (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your HTML-supported announcement text here...
Example:
🔥 <b>SPECIAL ANNOUNCEMENT</b>
⚡ New APK Download is ready!
<blockquote>Download from bot directly</blockquote>"
                  className="w-full px-3.5 py-3 rounded-xl bg-black/60 border border-white/10 focus:border-[#ff0080] text-white text-xs font-mono leading-relaxed focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Content Form: PHOTO MODE */}
            {activeTab === 'photo' && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoMode('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      photoMode === 'file' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📁 Upload Image File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      photoMode === 'url' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {photoMode === 'file' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-cyan-400 rounded-xl p-5 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                    >
                      <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-white">Click or Drag & Drop Image Here</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Supports PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => {
                        setPhotoUrl(e.target.value);
                        setPhotoPreview(e.target.value);
                      }}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                )}

                {/* Photo Preview Thumbnail */}
                {photoPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black max-h-48 flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-48 w-auto object-contain"
                      onError={() => setStatusMessage({ text: 'Failed to load image preview from URL.', type: 'error' })}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoBase64('');
                        setPhotoUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-rose-400 hover:text-rose-200 border border-rose-500/30 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Photo Caption (optional, HTML supported):
                  </label>
                  <textarea
                    rows={3}
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="🔥 <b>Exclusive VIP Gameplay Banner</b>\nDownload now below..."
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Content Form: SONG / AUDIO TRACK MODE */}
            {activeTab === 'song' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSongMode('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      songMode === 'file' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📁 Upload Music / Song File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      songMode === 'url' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔗 Audio URL (MP3 / Stream)
                  </button>
                </div>

                {songMode === 'file' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={songFileInputRef}
                      onChange={handleSongUpload}
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                      className="hidden"
                    />
                    <div
                      onClick={() => songFileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                    >
                      <FileAudio className="w-9 h-9 text-gray-400 group-hover:text-amber-400 mx-auto mb-2 transition-colors animate-pulse" />
                      <p className="text-xs font-bold text-white">Click or Drop Song (.mp3, .wav, .m4a, .flac) Here</p>
                      <p className="text-[10px] text-amber-300/80 mt-1">
                        Transmits as native Telegram Audio with full player scrubber, title, and artist tags!
                      </p>
                      {songFileName && (
                        <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg inline-block">
                          Selected: {songFileName}
                        </div>
                      )}
                    </div>

                    {songPreviewUrl && (
                      <div className="p-3 rounded-xl bg-[#0e0a1b] border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4" />
                            <span>Song Preview {songDuration ? `(${Math.floor(songDuration / 60)}:${(songDuration % 60).toString().padStart(2, '0')})` : ''}</span>
                          </span>
                          <button
                            type="button"
                            onClick={resetSong}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Song</span>
                          </button>
                        </div>
                        <audio
                          ref={songAudioPlayerRef}
                          src={songPreviewUrl}
                          controls
                          className="w-full h-8 accent-amber-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {songMode === 'url' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">Direct Audio URL:</label>
                    <input
                      type="text"
                      value={songUrl}
                      onChange={(e) => setSongUrl(e.target.value)}
                      placeholder="https://example.com/audio/kalam-theme.mp3"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-amber-400 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Song / Track Title:
                    </label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="e.g. KALAM FF Official Anthem"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-amber-400 text-white text-xs focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Performer / Artist Name:
                    </label>
                    <input
                      type="text"
                      value={songArtist}
                      onChange={(e) => setSongArtist(e.target.value)}
                      placeholder="e.g. KALAM FF Store"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-amber-400 text-white text-xs focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Song Caption / Description (HTML Supported):
                  </label>
                  <textarea
                    rows={2}
                    value={songCaption}
                    onChange={(e) => setSongCaption(e.target.value)}
                    placeholder="🔥 Listen to our latest release! Tap button below to join VIP..."
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-amber-400 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Content Form: VOICE NOTE MODE */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceMode('record')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      voiceMode === 'record' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🎙️ Microphone Recorder
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceMode('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      voiceMode === 'file' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📁 Upload Audio File
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      voiceMode === 'url' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔗 Audio URL
                  </button>
                </div>

                {voiceMode === 'record' && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 text-center space-y-3">
                    {!isRecording && !recordedAudioUrl && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2 mx-auto cursor-pointer transition-all"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Tap to Start Voice Recording</span>
                        </button>
                        <p className="text-[11px] text-gray-400">
                          Records live voice through your browser microphone and encodes into Telegram Voice Note (.ogg).
                        </p>
                      </div>
                    )}

                    {isRecording && (
                      <div className="space-y-3 py-2">
                        <div className="flex items-center justify-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-rose-400 font-mono text-base font-black">
                            {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                            {(recordingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1 h-6">
                          {[...Array(12)].map((_, idx) => (
                            <span
                              key={idx}
                              className="w-1 bg-emerald-400 rounded-full animate-bounce"
                              style={{
                                height: `${Math.max(6, Math.random() * 24)}px`,
                                animationDuration: `${0.4 + (idx % 4) * 0.15}s`
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center gap-2 mx-auto cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Recording</span>
                        </button>
                      </div>
                    )}

                    {recordedAudioUrl && !isRecording && (
                      <div className="p-3 rounded-xl bg-[#0e0a1b] border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4" />
                            <span>Voice Note Ready ({recordingSeconds || 5}s)</span>
                          </span>
                          <button
                            type="button"
                            onClick={resetRecording}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Discard & Record Again</span>
                          </button>
                        </div>

                        <audio
                          ref={audioPlayerRef}
                          src={recordedAudioUrl}
                          controls
                          className="w-full h-8 accent-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {voiceMode === 'file' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={audioFileInputRef}
                      onChange={handleAudioUpload}
                      accept="audio/*,.ogg,.mp3,.wav,.m4a,.webm"
                      className="hidden"
                    />
                    <div
                      onClick={() => audioFileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-5 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                    >
                      <FileAudio className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-white">Click or Drop Audio File Here</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Supports .ogg, .mp3, .wav, .m4a, .webm (Max 20MB)</p>
                    </div>

                    {recordedAudioUrl && (
                      <audio
                        ref={audioPlayerRef}
                        src={recordedAudioUrl}
                        controls
                        className="w-full h-8 mt-2"
                      />
                    )}
                  </div>
                )}

                {voiceMode === 'url' && (
                  <div>
                    <input
                      type="text"
                      value={voiceUrl}
                      onChange={(e) => setVoiceUrl(e.target.value)}
                      placeholder="https://example.com/audio-voice.ogg"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Voice Note Caption (optional):
                  </label>
                  <input
                    type="text"
                    value={voiceCaption}
                    onChange={(e) => setVoiceCaption(e.target.value)}
                    placeholder="🎙️ Audio announcement from KALAM STORE Admin"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Interactive URL Action Button */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-purple-400" />
                <span>3. Attach Inline Action Button (Optional)</span>
              </label>

              <button
                type="button"
                onClick={() => setEnableButton(!enableButton)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  enableButton ? 'bg-purple-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    enableButton ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {enableButton && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                <div>
                  <label className="text-[10.5px] text-gray-400 block mb-1">Button Label:</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="🛒 Buy VIP Key"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white text-xs font-semibold focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-gray-400 block mb-1">Button URL Link:</label>
                  <input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://t.me/kalamffpanel"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Action Buttons (Test Send & Broadcast Blast) */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-3">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span className="flex-1">{statusMessage.text}</span>
              </div>
            )}

            {broadcastProgress && (
              <div className="space-y-1.5 p-3 rounded-xl bg-black/60 border border-cyan-500/30">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Broadcasting in progress...</span>
                  <span className="text-white">{broadcastProgress.sent} / {broadcastProgress.total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-[#ff0080] transition-all duration-300"
                    style={{ width: `${Math.max(10, (broadcastProgress.sent / Math.max(1, broadcastProgress.total)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isTesting || isSending}
                onClick={handleSendTest}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>{isTesting ? 'Sending Test...' : '🧪 Send Test to Admin Chat'}</span>
              </button>

              <button
                type="button"
                disabled={isSending || isTesting}
                onClick={handleExecuteBroadcast}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0080] via-purple-600 to-[#00e5ff] hover:opacity-95 text-white font-black text-xs shadow-[0_0_25px_rgba(255,0,128,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 tracking-wide uppercase"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
                <span>
                  {isSending
                    ? 'Broadcasting Now...'
                    : `🚀 Blast Broadcast (${getRecipientCount()} Users)`}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live Telegram Chat Bubble Preview & History (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Preview Card */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Live Telegram Client Preview</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Dark UI Mode</span>
            </div>

            {/* Simulated Telegram Chat Window */}
            <div className="rounded-2xl bg-[#0f141c] border border-white/10 p-3.5 space-y-3 shadow-2xl relative">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ff0080] to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                  KF
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>KALAM FF PANEL</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono">BOT</span>
                  </div>
                  <div className="text-[9px] text-gray-400">bot announcement</div>
                </div>
              </div>

              {/* Chat Message Bubble */}
              <div className="bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 space-y-2 border border-white/5 shadow-md">
                {/* Photo Preview in Bubble */}
                {activeTab === 'photo' && photoPreview && (
                  <div className="rounded-xl overflow-hidden bg-black max-h-40 border border-white/5">
                    <img src={photoPreview} alt="Preview" className="w-full h-auto object-cover" />
                  </div>
                )}

                {/* Song / Music Track Player in Bubble */}
                {activeTab === 'song' && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="text-xs font-bold text-white truncate">
                        {songTitle || 'KALAM FF Audio Track'}
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-medium truncate">
                        {songArtist || 'KALAM FF Official'}
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-400 h-full w-1/3" />
                      </div>
                      <div className="flex justify-between text-[8.5px] text-gray-400 font-mono pt-0.5">
                        <span>0:00</span>
                        <span>{songDuration ? `${Math.floor(songDuration / 60)}:${(songDuration % 60).toString().padStart(2, '0')}` : '3:45'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Note Wave Preview in Bubble */}
                {activeTab === 'voice' && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1 h-3">
                        {[4, 8, 12, 16, 10, 6, 14, 18, 12, 8, 15, 7, 11, 5, 9].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-emerald-400/80 rounded-full"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        0:0{recordingSeconds || 4} • Voice Message
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div
                  className="text-xs text-gray-200 font-sans leading-relaxed whitespace-pre-wrap select-text"
                  dangerouslySetInnerHTML={{
                    __html:
                      (activeTab === 'text'
                        ? messageText
                        : activeTab === 'photo'
                        ? photoCaption
                        : activeTab === 'song'
                        ? songCaption
                        : voiceCaption) ||
                      '<i>Your formatted broadcast message will appear here in real-time...</i>'
                  }}
                />

                <div className="text-[9px] text-gray-400 text-right font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>

              {/* Inline Action Button in Bubble */}
              {enableButton && (
                <div className="pt-1">
                  <a
                    href={buttonUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-[#2b394e] hover:bg-[#33445c] text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-cyan-500/20 shadow"
                  >
                    <span>{buttonText || 'Action Button'}</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Recent Broadcasts History */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Recent Broadcasts ({recentHistory.length})</span>
              </label>

              <button
                type="button"
                onClick={fetchHistory}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Refresh Log</span>
              </button>
            </div>

            {recentHistory.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 bg-black/40 rounded-xl border border-white/5">
                No past broadcasts yet. Push your first announcement above!
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {recentHistory.slice(0, 10).map((h) => (
                  <div
                    key={h.broadcastId}
                    className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 hover:border-white/15 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                            h.type === 'photo'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : h.type === 'voice'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-[#ff0080]/20 text-[#ff0080] border border-[#ff0080]/40'
                          }`}
                        >
                          {h.type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold ${
                          h.status === 'COMPLETED' ? 'text-emerald-400' : h.status === 'PARTIAL' ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {h.sent}/{h.total} Sent
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 truncate font-mono">
                      {h.textSnippet}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5">
                      <span>Target: {h.targetLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (h.type === 'text') {
                            setActiveTab('text');
                            setMessageText(h.textSnippet);
                          } else if (h.type === 'photo') {
                            setActiveTab('photo');
                            setPhotoCaption(h.textSnippet);
                          }
                          if (h.hasButton && h.buttonText && h.buttonUrl) {
                            setEnableButton(true);
                            setButtonText(h.buttonText);
                            setButtonUrl(h.buttonUrl);
                          }
                          setStatusMessage({ text: 'Loaded broadcast template into form.', type: 'info' });
                        }}
                        className="text-cyan-400 hover:text-white font-bold underline"
                      >
                        Re-use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
