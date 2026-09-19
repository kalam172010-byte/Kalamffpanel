import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Save,
  Send,
  Users,
  ShoppingCart,
  Package,
  Shield,
  Sliders,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { TelegramNotificationSettings, TelegramNotificationTypeMeta } from '../types';

export const TelegramNotificationSettingsCard: React.FC = () => {
  const [settings, setSettings] = useState<TelegramNotificationSettings | null>(null);
  const [definitions, setDefinitions] = useState<TelegramNotificationTypeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<'all' | 'users' | 'orders' | 'inventory' | 'security' | 'system'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected test modal or drawer
  const [selectedTypeForTest, setSelectedTypeForTest] = useState<string>('newOrder');
  const [customTestChatId, setCustomTestChatId] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/telegram/notification-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setDefinitions(data.definitions || []);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load Telegram notification settings from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleType = async (typeKey: keyof TelegramNotificationSettings['types']) => {
    if (!settings) return;
    const current = settings.types[typeKey] ?? true;
    const updatedTypes = { ...settings.types, [typeKey]: !current };
    setSettings({ ...settings, types: updatedTypes });

    try {
      const res = await fetch('/api/admin/telegram/notification-settings/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeKey, enabled: !current })
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to toggle notification type:', err);
    }
  };

  const handleToggleAllInCategory = async (category: string, enable: boolean) => {
    if (!settings) return;
    const catDefs = definitions.filter(d => category === 'all' || d.category === category);
    const updatedTypes = { ...settings.types };
    catDefs.forEach(d => {
      (updatedTypes as any)[d.key] = enable;
    });

    setSettings({ ...settings, types: updatedTypes });

    try {
      await fetch('/api/admin/telegram/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: updatedTypes })
      });
      setStatusMessage({
        type: 'success',
        text: `All ${category.toUpperCase()} notifications ${enable ? 'enabled' : 'disabled'}.`
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to batch toggle:', err);
    }
  };

  const handleSaveAll = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetch('/api/admin/telegram/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        setStatusMessage({ type: 'success', text: 'All notification preferences saved and synchronized to server disk!' });
        setTimeout(() => setSaveSuccess(false), 3000);
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (typeKey: string) => {
    try {
      setTestingKey(typeKey);
      const res = await fetch('/api/admin/telegram/notification-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeKey,
          targetChatId: customTestChatId.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ Test alert for "${typeKey}" delivered successfully to Telegram chat ${data.deliveredTo}!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to deliver test alert via Telegram.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error during test dispatch' });
    } finally {
      setTestingKey(null);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all Telegram notification settings and thresholds to default values?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/telegram/notification-settings/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setStatusMessage({ type: 'info', text: 'Notification preferences restored to factory defaults.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset settings' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="bg-[#12121e] border border-white/10 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-white font-bold text-lg">Loading Telegram Notification Settings...</h3>
        <p className="text-gray-400 text-xs">Fetching notification triggers and customized rules.</p>
      </div>
    );
  }

  if (!settings) return null;

  // Filtered list
  const filteredDefinitions = definitions.filter(d => {
    const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
    const isEnabled = !!settings.types[d.key as keyof typeof settings.types];
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && isEnabled) ||
      (statusFilter === 'disabled' && !isEnabled);
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.key.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalTypesCount = definitions.length;
  const enabledCount = definitions.filter(d => !!settings.types[d.key as keyof typeof settings.types]).length;
  const disabledCount = totalTypesCount - enabledCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Master Controls */}
      <div className="bg-gradient-to-r from-[#141428] via-[#161632] to-[#121226] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Telegram Notification Controls & Toggles
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  settings.masterNotificationsEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {settings.masterNotificationsEnabled ? '● Alerts Active' : '○ Master Muted'}
                </span>
                {settings.quietHoursEnabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Quiet Hours ({settings.quietHoursStart}-{settings.quietHoursEnd})
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Customize instant Telegram alerts for new user registrations, low inventory warnings, reseller upgrades, UPI deposits, and upstream errors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Master Switch */}
            <button
              onClick={() => setSettings({ ...settings, masterNotificationsEnabled: !settings.masterNotificationsEnabled })}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                settings.masterNotificationsEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
              }`}
            >
              {settings.masterNotificationsEnabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {settings.masterNotificationsEnabled ? 'Master: ON' : 'Master: MUTED'}
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-900/40 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Preferences'}
            </button>

            {/* Factory Reset */}
            <button
              onClick={handleResetDefaults}
              className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all"
              title="Reset to factory defaults"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : statusMessage.type === 'error'
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
        }`}>
          {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {statusMessage.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Global Quick Stats & Thresholds Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121222] border border-white/5 p-3.5 rounded-2xl">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Triggers</div>
          <div className="text-xl font-black text-white mt-1">{totalTypesCount} Types</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Customizable events</div>
        </div>

        <div className="bg-[#121222] border border-emerald-500/20 p-3.5 rounded-2xl">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Alerts</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{enabledCount} Active</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Delivering to Telegram</div>
        </div>

        <div className="bg-[#121222] border border-rose-500/20 p-3.5 rounded-2xl">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Muted Triggers</div>
          <div className="text-xl font-black text-rose-400 mt-1">{disabledCount} Disabled</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Suppressed from chat</div>
        </div>

        <div className="bg-[#121222] border border-amber-500/20 p-3.5 rounded-2xl">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock Warning Level</div>
          <div className="text-xl font-black text-amber-400 mt-1">&lt; {settings.lowStockThreshold} Keys</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Threshold trigger</div>
        </div>
      </div>

      {/* Main Configuration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notification Checkbox Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar: Category Tabs, Status Filter, Search */}
          <div className="bg-[#121222] border border-white/10 rounded-2xl p-4 space-y-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Notifications', icon: Layers },
                { id: 'users', label: 'Users & Resellers', icon: Users },
                { id: 'orders', label: 'Orders & Payments', icon: ShoppingCart },
                { id: 'inventory', label: 'Stock & Inventory', icon: Package },
                { id: 'security', label: 'Security & Logins', icon: Shield },
                { id: 'system', label: 'System & Upstream', icon: Sliders }
              ].map(cat => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search alert triggers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center bg-[#0b0b14] border border-white/10 rounded-xl p-0.5 text-[11px] font-bold">
                  {(['all', 'enabled', 'disabled'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        statusFilter === f ? 'bg-cyan-500 text-black font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Batch Action */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleAllInCategory(activeCategory, true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"
                    title="Enable all shown"
                  >
                    All ON
                  </button>
                  <button
                    onClick={() => handleToggleAllInCategory(activeCategory, false)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all cursor-pointer"
                    title="Disable all shown"
                  >
                    All OFF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Notification Type Cards */}
          <div className="space-y-3">
            {filteredDefinitions.length === 0 ? (
              <div className="bg-[#121222] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                <p className="text-gray-400 text-sm font-bold">No notification triggers match your filter criteria.</p>
                <button
                  onClick={() => { setActiveCategory('all'); setStatusFilter('all'); setSearchQuery(''); }}
                  className="text-xs text-cyan-400 hover:underline font-bold"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredDefinitions.map(def => {
                const isEnabled = !!settings.types[def.key as keyof typeof settings.types];
                const isTesting = testingKey === def.key;

                return (
                  <div
                    key={def.id}
                    className={`border rounded-2xl p-4 transition-all ${
                      isEnabled
                        ? 'bg-[#141428] border-cyan-500/30 hover:border-cyan-500/60 shadow-md'
                        : 'bg-[#0f0f1c] border-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                          isEnabled
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                            : 'bg-white/5 border border-white/10 text-gray-400'
                        }`}>
                          {def.icon}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-white">{def.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-gray-400 uppercase tracking-wider">
                              {def.category}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              <code>{def.key}</code>
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 leading-relaxed">
                            {def.description}
                          </p>

                          {def.samplePayload && (
                            <div className="mt-2 text-[11px] font-mono text-gray-400 bg-[#090912] border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                              <span className="text-cyan-400 font-bold">Sample:</span>
                              <span className="truncate">{def.samplePayload}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions (Test & Checkbox Toggle) */}
                      <div className="flex items-center gap-3 flex-shrink-0 pt-1">
                        {/* Test Button */}
                        <button
                          onClick={() => handleSendTest(def.key)}
                          disabled={isTesting}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Dispatch a test alert to Telegram"
                        >
                          {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Test Alert</span>
                        </button>

                        {/* Checkbox Styled Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleType(def.key as any)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Destination Overrides & Threshold Customizations */}
        <div className="space-y-5">
          {/* Destination Overrides */}
          <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Delivery Routing & Targets</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">
                  Admin Chat ID Override
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7768975239 (Leave empty for bot default)"
                  value={settings.adminChatIdOverride || ''}
                  onChange={e => setSettings({ ...settings, adminChatIdOverride: e.target.value })}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Primary chat to receive instant admin notifications.
                </span>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">
                  Dedicated Staff Channel / Group ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. -100192837482"
                  value={settings.alertChannelId || ''}
                  onChange={e => setSettings({ ...settings, alertChannelId: e.target.value })}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Send a duplicate alert to a private Telegram moderation channel.
                </span>
              </div>
            </div>
          </div>

          {/* Thresholds & Triggers */}
          <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Threshold Triggers & Rules</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">
                  Low Key Stock Alert Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.lowStockThreshold}
                    onChange={e => setSettings({ ...settings, lowStockThreshold: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-24 bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                  <span className="text-gray-400">Keys remaining</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Triggers alert when available key inventory falls to or below this count.
                </span>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">
                  High API Failure Rate Alert (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.highFailureRateThresholdPercent}
                    onChange={e => setSettings({ ...settings, highFailureRateThresholdPercent: Math.max(5, parseInt(e.target.value) || 20) })}
                    className="w-24 bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  />
                  <span className="text-gray-400">% failure rate</span>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">
                  Minimum Deposit Alert Amount (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.minDepositNotificationAmount}
                    onChange={e => setSettings({ ...settings, minDepositNotificationAmount: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-24 bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                  <span className="text-gray-400">₹ minimum</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formatting & Behavior */}
          <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Display & Formatting</h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0b14] border border-white/5 cursor-pointer hover:border-white/10">
                <span className="text-gray-300 font-medium">Include User Balance in Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.includeUserBalanceInAlerts}
                  onChange={e => setSettings({ ...settings, includeUserBalanceInAlerts: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded bg-gray-800 border-gray-700"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0b14] border border-white/5 cursor-pointer hover:border-white/10">
                <span className="text-gray-300 font-medium">Include IP Address in Security Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.includeIpAddress}
                  onChange={e => setSettings({ ...settings, includeIpAddress: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded bg-gray-800 border-gray-700"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0b14] border border-white/5 cursor-pointer hover:border-white/10">
                <span className="text-gray-300 font-medium">Attach Quick Action Buttons</span>
                <input
                  type="checkbox"
                  checked={settings.includeQuickActionButtons}
                  onChange={e => setSettings({ ...settings, includeQuickActionButtons: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded bg-gray-800 border-gray-700"
                />
              </label>
            </div>
          </div>

          {/* Quiet Hours (Do Not Disturb) */}
          <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white">Quiet Hours (DND)</h3>
              </div>
              <input
                type="checkbox"
                checked={settings.quietHoursEnabled}
                onChange={e => setSettings({ ...settings, quietHoursEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-500 rounded bg-gray-800 border-gray-700 cursor-pointer"
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <label className="text-gray-400 font-bold block mb-1">Mute Start</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={e => setSettings({ ...settings, quietHoursStart: e.target.value })}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-bold block mb-1">Mute End</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={e => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instant Test Dispatcher Console */}
          <div className="bg-gradient-to-br from-[#131326] to-[#171736] border border-cyan-500/30 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-300">
              <Send className="w-4 h-4" />
              <h3 className="text-sm font-extrabold text-white">Instant Test Console</h3>
            </div>
            <p className="text-[11px] text-gray-400">
              Fire a test notification event directly to Telegram to test bot delivery and inline action buttons.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Select Event Type</label>
                <select
                  value={selectedTypeForTest}
                  onChange={e => setSelectedTypeForTest(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {definitions.map(d => (
                    <option key={d.key} value={d.key}>
                      {d.icon} {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Custom Target Chat ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to admin chat"
                  value={customTestChatId}
                  onChange={e => setCustomTestChatId(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <button
                onClick={() => handleSendTest(selectedTypeForTest)}
                disabled={testingKey === selectedTypeForTest}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
              >
                {testingKey === selectedTypeForTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Test Alert to Telegram</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
