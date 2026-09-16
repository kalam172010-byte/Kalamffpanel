const fs = require('fs');
const path = require('path');

function patchBundleWithReelsStudio(targetPath) {
  if (!fs.existsSync(targetPath)) {
    console.log('[Reels Studio Patch] Target bundle not found:', targetPath);
    return false;
  }

  let code = fs.readFileSync(targetPath, 'utf8');
  let changed = false;

  // 1. Injected definition with idempotent window property assignment so it never throws duplicate const/let errors
  const componentDeclaration = `if(typeof window!=="undefined"&&!window.ReelsMarketingStudio){
  window.ReelsMarketingStudio = function ReelsMarketingStudio() {
    var websiteNameState = q.useState('KALAM FF PANEL');
    var websiteName = websiteNameState[0];
    var setWebsiteName = websiteNameState[1];

    var websiteUrlState = q.useState(typeof window !== 'undefined' ? window.location.origin : 'https://kalamffpanel.com');
    var websiteUrl = websiteUrlState[0];
    var setWebsiteUrl = websiteUrlState[1];

    var botUsernameState = q.useState('@kalam_store_bot');
    var botUsername = botUsernameState[0];
    var setBotUsername = botUsernameState[1];

    var productFocusState = q.useState('Free Fire Keys & VIP Panels');
    var productFocus = productFocusState[0];
    var setProductFocus = productFocusState[1];

    var botFeaturesState = q.useState('Instant 2-second key delivery, UPI wallet deposits, 24/7 automated bot, zero waiting time');
    var botFeatures = botFeaturesState[0];
    var setBotFeatures = botFeaturesState[1];

    var targetAudienceState = q.useState('Tamil Free Fire gamers, tournament players & resellers');
    var targetAudience = targetAudienceState[0];
    var setTargetAudience = targetAudienceState[1];

    var toneState = q.useState('High-energy gaming influencer style');
    var tone = toneState[0];
    var setTone = toneState[1];

    var customNotesState = q.useState('');
    var customNotes = customNotesState[0];
    var setCustomNotes = customNotesState[1];

    var isGeneratingState = q.useState(false);
    var isGenerating = isGeneratingState[0];
    var setIsGenerating = isGeneratingState[1];

    var copiedKeyState = q.useState(null);
    var copiedKey = copiedKeyState[0];
    var setCopiedKey = copiedKeyState[1];

    var activeTabState = q.useState('tamil');
    var activeTab = activeTabState[0];
    var setActiveTab = activeTabState[1];

    var resultState = q.useState(null);
    var result = resultState[0];
    var setResult = resultState[1];

    var generationSourceState = q.useState(null);
    var generationSource = generationSourceState[0];
    var setGenerationSource = generationSourceState[1];

    var copyToClipboard = function(text, key) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(function() { setCopiedKey(null); }, 2000);
      }
    };

    var handleGenerate = async function() {
      setIsGenerating(true);
      try {
        var res = await fetch('/api/admin/reels/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteName: websiteName,
            websiteUrl: websiteUrl,
            botUsername: botUsername,
            botFeatures: botFeatures,
            productFocus: productFocus,
            targetAudience: targetAudience,
            tone: tone,
            customNotes: customNotes
          })
        });
        var data = await res.json();
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

    return r.jsxs("div", {
      className: "space-y-6",
      id: "reels-marketing-studio-container",
      children: [
        /* Header Banner */
        r.jsxs("div", {
          className: "p-5 rounded-2xl bg-gradient-to-r from-[#1b0d36] via-[#120e26] to-[#0a1226] border border-pink-500/40 shadow-[0_0_25px_rgba(255,0,128,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4",
          children: [
            r.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                r.jsx("div", {
                  className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,128,0.4)] shrink-0",
                  children: r.jsx(bU, { className: "w-6 h-6" })
                }),
                r.jsxs("div", {
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2 flex-wrap",
                      children: [
                        r.jsx("h2", {
                          className: "text-base sm:text-lg font-black text-white tracking-wide",
                          children: "🎬 Instagram Reels Script Studio (30s Tamil Generator)"
                        }),
                        r.jsx("span", {
                          className: "px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold",
                          children: "10s + 10s + 10s Split"
                        })
                      ]
                    }),
                    r.jsx("p", {
                      className: "text-xs text-gray-300 mt-0.5",
                      children: "Input your Store & Telegram Bot details to generate viral 30-second Tamil Reels scripts, AI video & voice prompts, and ready-to-post captions."
                    })
                  ]
                })
              ]
            }),
            r.jsxs("button", {
              type: "button",
              onClick: handleGenerate,
              disabled: isGenerating,
              className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,128,0.35)] cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0",
              children: [
                isGenerating ? r.jsx(Ms, { className: "w-4 h-4 animate-spin" }) : r.jsx(Sr, { className: "w-4 h-4" }),
                r.jsx("span", { children: isGenerating ? "Generating Script..." : "Generate 30s Reels Script" })
              ]
            })
          ]
        }),

        /* Content Grid */
        r.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-12 gap-5",
          children: [
            /* Left Column: Input Form */
            r.jsx("div", {
              className: "lg:col-span-5 space-y-4",
              children: r.jsxs("div", {
                className: "p-4 sm:p-5 rounded-2xl bg-[#12121e] border border-white/10 space-y-4",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-2 pb-3 border-b border-white/10",
                    children: [
                      r.jsx(bU, { className: "w-4 h-4 text-pink-400" }),
                      r.jsx("h3", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "Marketing Target & Store Details" })
                    ]
                  }),
                  r.jsxs("div", {
                    className: "space-y-3",
                    children: [
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🌐 Website / Panel Name" }),
                          r.jsx("input", {
                            type: "text",
                            value: websiteName,
                            onChange: function(e) { setWebsiteName(e.target.value); },
                            placeholder: "e.g. KALAM FF PANEL",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🔗 Website URL (For Bio Link / CTA)" }),
                          r.jsx("input", {
                            type: "text",
                            value: websiteUrl,
                            onChange: function(e) { setWebsiteUrl(e.target.value); },
                            placeholder: "https://...",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:border-pink-500 focus:outline-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🤖 Telegram Bot Username" }),
                          r.jsx("input", {
                            type: "text",
                            value: botUsername,
                            onChange: function(e) { setBotUsername(e.target.value); },
                            placeholder: "@kalam_store_bot",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-purple-300 font-mono focus:border-purple-500 focus:outline-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🎮 Product / Key Focus" }),
                          r.jsx("input", {
                            type: "text",
                            value: productFocus,
                            onChange: function(e) { setProductFocus(e.target.value); },
                            placeholder: "e.g. Free Fire Keys & VIP Panels",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🔥 Key Features & USPs" }),
                          r.jsx("textarea", {
                            rows: 2,
                            value: botFeatures,
                            onChange: function(e) { setBotFeatures(e.target.value); },
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none resize-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "🎯 Target Audience" }),
                          r.jsx("input", {
                            type: "text",
                            value: targetAudience,
                            onChange: function(e) { setTargetAudience(e.target.value); },
                            placeholder: "Tamil Free Fire gamers, tournament players...",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none"
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "⚡ Video Tone" }),
                          r.jsxs("select", {
                            value: tone,
                            onChange: function(e) { setTone(e.target.value); },
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none",
                            children: [
                              r.jsx("option", { value: "High-energy gaming influencer style", children: "High-energy gaming influencer style" }),
                              r.jsx("option", { value: "Urgent / Limited Deal promotional tone", children: "Urgent / Limited Deal promotional tone" }),
                              r.jsx("option", { value: "Curious / Secret Method hook", children: "Curious / Secret Method hook" }),
                              r.jsx("option", { value: "Step-by-step fast tutorial tone", children: "Step-by-step fast tutorial tone" })
                            ]
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("label", { className: "text-[11px] font-bold text-gray-300 block mb-1", children: "💬 Special Instructions (Optional)" }),
                          r.jsx("input", {
                            type: "text",
                            value: customNotes,
                            onChange: function(e) { setCustomNotes(e.target.value); },
                            placeholder: "e.g. Highlight instant UPI QR payment & discounts",
                            className: "w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-pink-500 focus:outline-none"
                          })
                        ]
                      })
                    ]
                  }),
                  r.jsxs("button", {
                    type: "button",
                    onClick: handleGenerate,
                    disabled: isGenerating,
                    className: "w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,128,0.25)] cursor-pointer transition-all active:scale-95 disabled:opacity-50",
                    children: [
                      isGenerating ? r.jsx(Ms, { className: "w-3.5 h-3.5 animate-spin" }) : r.jsx(Sr, { className: "w-3.5 h-3.5" }),
                      r.jsx("span", { children: isGenerating ? "Generating 30s Script..." : "Generate Script in Tamil" })
                    ]
                  })
                ]
              })
            }),

            /* Right Column: Results & Scenes */
            r.jsx("div", {
              className: "lg:col-span-7 space-y-4",
              children: !result && !isGenerating ? (
                r.jsxs("div", {
                  className: "p-8 rounded-2xl bg-[#12121e] border border-white/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[420px]",
                  children: [
                    r.jsx("div", {
                      className: "w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(255,0,128,0.15)]",
                      children: r.jsx(bU, { className: "w-8 h-8" })
                    }),
                    r.jsx("h4", { className: "text-sm font-bold text-white", children: "Ready to Generate 30-Second Tamil Reels" }),
                    r.jsx("p", {
                      className: "text-xs text-gray-400 max-w-md",
                      children: "Click 'Generate 30s Reels Script' to create a timed 3-scene breakdown (0-10s, 10-20s, 20-30s) in Tamil with AI video prompts and caption copies."
                    }),
                    r.jsxs("button", {
                      type: "button",
                      onClick: handleGenerate,
                      className: "mt-2 px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
                      children: [
                        r.jsx(Sr, { className: "w-3.5 h-3.5" }),
                        r.jsx("span", { children: "Generate Marketing Script Now" })
                      ]
                    })
                  ]
                })
              ) : isGenerating ? (
                r.jsxs("div", {
                  className: "p-8 rounded-2xl bg-[#12121e] border border-pink-500/30 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]",
                  children: [
                    r.jsx("div", {
                      className: "w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 animate-pulse shadow-[0_0_25px_rgba(255,0,128,0.3)]",
                      children: r.jsx(Ms, { className: "w-8 h-8 animate-spin" })
                    }),
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("h4", { className: "text-sm font-bold text-white", children: "Crafting 30s Tamil Reels Scenes..." }),
                        r.jsx("p", { className: "text-xs text-gray-400", children: "Structuring 10-second scene cuts, viral hooks, spoken Tamil voiceover, and video generator prompts." })
                      ]
                    })
                  ]
                })
              ) : (
                r.jsxs("div", {
                  className: "space-y-4",
                  children: [
                    /* Output Tab Bar */
                    r.jsxs("div", {
                      className: "flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10",
                          children: [
                            r.jsx("button", {
                              type: "button",
                              onClick: function() { setActiveTab('tamil'); },
                              className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'tamil' ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(255,0,128,0.4)]' : 'text-gray-400 hover:text-white'),
                              children: "🎬 30s Tamil Script"
                            }),
                            r.jsx("button", {
                              type: "button",
                              onClick: function() { setActiveTab('english'); },
                              className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'english' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]' : 'text-gray-400 hover:text-white'),
                              children: "🇬🇧 English Script"
                            }),
                            r.jsx("button", {
                              type: "button",
                              onClick: function() { setActiveTab('ai_prompts'); },
                              className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'ai_prompts' ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]' : 'text-gray-400 hover:text-white'),
                              children: "🤖 AI Video & VO Prompts"
                            }),
                            r.jsx("button", {
                              type: "button",
                              onClick: function() { setActiveTab('captions'); },
                              className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'captions' ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'text-gray-400 hover:text-white'),
                              children: "📱 Instagram Caption"
                            })
                          ]
                        }),
                        generationSource && r.jsxs("span", {
                          className: "text-[10px] font-mono text-gray-400 flex items-center gap-1",
                          children: [
                            r.jsx(Sr, { className: "w-3 h-3 text-pink-400" }),
                            "Generated via " + generationSource
                          ]
                        })
                      ]
                    }),

                    /* Active Tab 1: Tamil Script Breakdown (10s + 10s + 10s) */
                    activeTab === 'tamil' && r.jsxs("div", {
                      className: "space-y-3.5",
                      children: [
                        (result && result.scenes ? result.scenes : []).map(function(sc, idx) {
                          return r.jsxs("div", {
                            key: idx,
                            className: "p-4 rounded-2xl bg-[#12121e] border border-pink-500/30 shadow-[0_0_15px_rgba(255,0,128,0.06)] space-y-3",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      r.jsx("span", {
                                        className: "w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 font-mono font-bold text-xs flex items-center justify-center border border-pink-500/30",
                                        children: sc.sceneNumber
                                      }),
                                      r.jsx("span", { className: "text-xs font-black text-white", children: sc.title })
                                    ]
                                  }),
                                  r.jsx("span", {
                                    className: "px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold",
                                    children: "⏱️ " + sc.timeRange
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-xs",
                                children: [
                                  r.jsxs("div", {
                                    className: "p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider block", children: "📺 Visual Hook (காட்சி)" }),
                                      r.jsx("p", { className: "text-gray-200 leading-relaxed", children: sc.visualHookTamil })
                                    ]
                                  }),
                                  r.jsxs("div", {
                                    className: "p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-pink-400 uppercase tracking-wider block", children: "✨ On-Screen Text (திரை உரை)" }),
                                      r.jsx("p", { className: "text-pink-300 font-bold leading-relaxed", children: sc.onScreenTextTamil })
                                    ]
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "p-3 rounded-xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/20 space-y-1.5",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-pink-400 uppercase tracking-wider", children: "🎙️ Tamil Spoken Dialogue (குரல் பதிவு - தமிழ்)" }),
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: function() { copyToClipboard(sc.voiceoverScriptTamil, "vo_ta_" + idx); },
                                        className: "text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer",
                                        children: copiedKey === "vo_ta_" + idx ? "✓ Copied" : "Copy Dialogue"
                                      })
                                    ]
                                  }),
                                  r.jsxs("p", { className: "text-xs text-white leading-relaxed font-medium", children: ['"', sc.voiceoverScriptTamil, '"'] })
                                ]
                              })
                            ]
                          });
                        }),
                        r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#161324] border border-cyan-500/30 space-y-2",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "Full 30-Second Tamil Voiceover (ElevenLabs Ready)" }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: function() { copyToClipboard(result ? result.aiVoiceoverPromptTamil : '', "full_ta"); },
                                  className: "px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-300 cursor-pointer",
                                  children: copiedKey === "full_ta" ? "✓ Copied All" : "Copy All Tamil VO"
                                })
                              ]
                            }),
                            r.jsx("pre", {
                              className: "p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed",
                              children: result ? result.aiVoiceoverPromptTamil : ''
                            })
                          ]
                        })
                      ]
                    }),

                    /* Active Tab 2: English Script */
                    activeTab === 'english' && r.jsxs("div", {
                      className: "space-y-3.5",
                      children: [
                        (result && result.scenes ? result.scenes : []).map(function(sc, idx) {
                          return r.jsxs("div", {
                            key: idx,
                            className: "p-4 rounded-2xl bg-[#12121e] border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.06)] space-y-3",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      r.jsx("span", {
                                        className: "w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30",
                                        children: sc.sceneNumber
                                      }),
                                      r.jsx("span", { className: "text-xs font-black text-white", children: sc.title })
                                    ]
                                  }),
                                  r.jsx("span", {
                                    className: "px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold",
                                    children: "⏱️ " + sc.timeRange
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-xs",
                                children: [
                                  r.jsxs("div", {
                                    className: "p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider block", children: "📺 Visual Hook" }),
                                      r.jsx("p", { className: "text-gray-200 leading-relaxed", children: sc.visualHookEnglish })
                                    ]
                                  }),
                                  r.jsxs("div", {
                                    className: "p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-purple-400 uppercase tracking-wider block", children: "✨ On-Screen Text" }),
                                      r.jsx("p", { className: "text-purple-300 font-bold leading-relaxed", children: sc.onScreenTextEnglish })
                                    ]
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "p-3 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/20 space-y-1.5",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-bold text-purple-400 uppercase tracking-wider", children: "🎙️ English Dialogue" }),
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: function() { copyToClipboard(sc.voiceoverScriptEnglish, "vo_en_" + idx); },
                                        className: "text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer",
                                        children: copiedKey === "vo_en_" + idx ? "✓ Copied" : "Copy Dialogue"
                                      })
                                    ]
                                  }),
                                  r.jsxs("p", { className: "text-xs text-white leading-relaxed font-medium", children: ['"', sc.voiceoverScriptEnglish, '"'] })
                                ]
                              })
                            ]
                          });
                        }),
                        r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#161324] border border-purple-500/30 space-y-2",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "Full 30-Second English Voiceover Script" }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: function() { copyToClipboard(result ? result.aiVoiceoverPromptEnglish : '', "full_en"); },
                                  className: "px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-purple-300 cursor-pointer",
                                  children: copiedKey === "full_en" ? "✓ Copied All" : "Copy All English VO"
                                })
                              ]
                            }),
                            r.jsx("pre", {
                              className: "p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed",
                              children: result ? result.aiVoiceoverPromptEnglish : ''
                            })
                          ]
                        })
                      ]
                    }),

                    /* Active Tab 3: AI Video & Voice Prompts */
                    activeTab === 'ai_prompts' && r.jsxs("div", {
                      className: "space-y-4",
                      children: [
                        r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#12121e] border border-cyan-500/30 space-y-3",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "🤖 AI Video Avatar Prompt (HeyGen / Kling / Runway / D-ID)" }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: function() { copyToClipboard(result ? result.aiVideoPrompt : '', "vid_p"); },
                                  className: "px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 border border-cyan-500/30 cursor-pointer",
                                  children: copiedKey === "vid_p" ? "✓ Copied Prompt" : "Copy Video Prompt"
                                })
                              ]
                            }),
                            r.jsx("p", { className: "text-[11px] text-gray-400", children: "Paste this into HeyGen, D-ID, Kling, or Midjourney/Runway to generate the visual avatar video:" }),
                            r.jsx("pre", {
                              className: "p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-cyan-200 whitespace-pre-wrap font-mono leading-relaxed",
                              children: result ? result.aiVideoPrompt : ''
                            })
                          ]
                        }),
                        result && result.tips && result.tips.length > 0 && r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#12121e] border border-amber-500/30 space-y-2.5",
                          children: [
                            r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "💡 Reels Viral Optimization Checklist" }),
                            r.jsx("ul", {
                              className: "space-y-1.5 text-xs text-gray-300",
                              children: result.tips.map(function(tip, i) {
                                return r.jsxs("li", {
                                  className: "flex items-start gap-2",
                                  children: [
                                    r.jsx("span", { className: "text-amber-400 font-bold", children: "•" }),
                                    r.jsx("span", { children: tip })
                                  ]
                                }, i);
                              })
                            })
                          ]
                        })
                      ]
                    }),

                    /* Active Tab 4: Instagram Caption */
                    activeTab === 'captions' && r.jsxs("div", {
                      className: "space-y-4",
                      children: [
                        r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#12121e] border border-pink-500/30 space-y-3",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "📝 Ready-to-Post Tamil Caption" }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: function() { copyToClipboard(result ? result.instagramCaptionTamil : '', "cap_t"); },
                                  className: "px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-xs font-bold text-pink-300 border border-pink-500/30 cursor-pointer",
                                  children: copiedKey === "cap_t" ? "✓ Copied Caption" : "Copy Tamil Caption"
                                })
                              ]
                            }),
                            r.jsx("pre", {
                              className: "p-3 bg-black/50 border border-white/5 rounded-xl text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed",
                              children: result ? result.instagramCaptionTamil : ''
                            })
                          ]
                        }),
                        result && result.hashtags && result.hashtags.length > 0 && r.jsxs("div", {
                          className: "p-4 rounded-2xl bg-[#12121e] border border-blue-500/30 space-y-2.5",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("h4", { className: "text-xs font-bold text-white uppercase tracking-wider", children: "#️⃣ Targeted Gaming Hashtags" }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: function() { copyToClipboard(result.hashtags.join(" "), "hash_all"); },
                                  className: "px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-300 border border-blue-500/30 cursor-pointer",
                                  children: copiedKey === "hash_all" ? "✓ Copied Tags" : "Copy All Tags"
                                })
                              ]
                            }),
                            r.jsx("div", {
                              className: "flex flex-wrap gap-1.5",
                              children: result.hashtags.map(function(h, i) {
                                return r.jsx("span", {
                                  className: "px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono font-medium",
                                  children: h
                                }, i);
                              })
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              )
            })
          ]
        })
      ]
    });
  };
}
`;

  // Always replace the declaration block with the corrected version
  const oldDeclRegex = /if\(typeof window!=="undefined"&&!window\.ReelsMarketingStudio\)\{[\s\S]*?\}\n/g;
  if (oldDeclRegex.test(code)) {
    code = code.replace(oldDeclRegex, '');
    changed = true;
  }

  code = componentDeclaration + '\n' + code;
  changed = true;
  console.log('[Reels Studio Patch] Injected updated window.ReelsMarketingStudio component');

  // 2. Add navigation tab item in admin tabs list: {id:"reels_studio",label:"🎬 Reels AI Studio",icon:bU}
  const targetNavItems = '{id:"store_settings",label:"🎨 Store UI/UX Editor",icon:ND},{id:"telegram_bot",label:"🤖 Telegram Bot",icon:zF}';
  const newNavItems = '{id:"store_settings",label:"🎨 Store UI/UX Editor",icon:ND},{id:"telegram_bot",label:"🤖 Telegram Bot",icon:zF},{id:"reels_studio",label:"🎬 Reels AI Studio",icon:bU}';
  if (code.includes(targetNavItems) && !code.includes('id:"reels_studio"')) {
    code = code.replace(targetNavItems, newNavItems);
    changed = true;
    console.log('[Reels Studio Patch] Added reels_studio to main admin navigation items');
  }

  // 3. Add to admin search keywords
  const targetKeywordsStore = '{id:"telegram_bot",label:"🤖 Telegram Bot",keywords:';
  const newKeywordsStore = '{id:"reels_studio",label:"🎬 Reels AI Studio",keywords:["reels","video","tamil","marketing","prompt","script","ai video","instagram","scene"]},{id:"telegram_bot",label:"🤖 Telegram Bot",keywords:';
  if (code.includes(targetKeywordsStore) && !code.includes('id:"reels_studio",label:"🎬 Reels AI Studio",keywords:')) {
    code = code.replace(targetKeywordsStore, newKeywordsStore);
    changed = true;
    console.log('[Reels Studio Patch] Added reels_studio to admin search keywords');
  }

  // 4. Add to quick navigation buttons
  const targetQuick = '{id:"store_settings",label:"🎨 Store UI/UX"},{id:"telegram_bot",label:"🤖 Telegram Bot"}';
  const newQuick = '{id:"store_settings",label:"🎨 Store UI/UX"},{id:"telegram_bot",label:"🤖 Telegram Bot"},{id:"reels_studio",label:"🎬 Reels Studio"}';
  if (code.includes(targetQuick) && !code.includes('{id:"reels_studio",label:"🎬 Reels Studio"}')) {
    code = code.replace(targetQuick, newQuick);
    changed = true;
    console.log('[Reels Studio Patch] Added reels_studio to quick navigation buttons');
  }

  // 5. Mount ReelsMarketingStudio in admin tab router: l==="reels_studio"&&r.jsx(window.ReelsMarketingStudio,{})
  if (code.includes('l==="reels_studio"&&r.jsx(ReelsMarketingStudio,{})')) {
    code = code.replace('l==="reels_studio"&&r.jsx(ReelsMarketingStudio,{})', 'l==="reels_studio"&&r.jsx(window.ReelsMarketingStudio,{})');
    changed = true;
  } else {
    const targetAdminRoute = '(l==="store_settings"||l==="telegram_bot")&&r.jsx(tne,{settings:te,onSaveSettings:Ja,initialTab:l==="telegram_bot"?"telegram":"branding"})';
    const newAdminRoute = '(l==="store_settings"||l==="telegram_bot")&&r.jsx(tne,{settings:te,onSaveSettings:Ja,initialTab:l==="telegram_bot"?"telegram":"branding"}),l==="reels_studio"&&r.jsx(window.ReelsMarketingStudio,{})';
    if (code.includes(targetAdminRoute) && !code.includes('l==="reels_studio"')) {
      code = code.replace(targetAdminRoute, newAdminRoute);
      changed = true;
      console.log('[Reels Studio Patch] Connected reels_studio to admin tab router');
    }
  }

  // 6. Subtab inside Store / Bot Settings (tne)
  const telegramTabBtn = 'r.jsx("span",{children:"🤖 Telegram Bot & APK"})]})';
  const reelsSubTabBtn = ',r.jsxs("button",{onClick:()=>s("reels_studio"),className:`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${t==="reels_studio"?"bg-pink-500/20 text-pink-300 border border-pink-500/50 shadow-[0_0_12px_rgba(255,0,128,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`,children:[r.jsx(bU,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"🎬 Reels Studio"})]})';
  if (code.includes(telegramTabBtn) && !code.includes('s("reels_studio")')) {
    code = code.replace(telegramTabBtn, telegramTabBtn + reelsSubTabBtn);
    changed = true;
    console.log('[Reels Studio Patch] Added Reels Studio subtab in tne settings');
  }

  // 7. Render ReelsMarketingStudio when t==="reels_studio" inside tne
  if (code.includes('t==="reels_studio"&&r.jsx(ReelsMarketingStudio,{})')) {
    code = code.replace('t==="reels_studio"&&r.jsx(ReelsMarketingStudio,{})', 't==="reels_studio"&&r.jsx(window.ReelsMarketingStudio,{})');
    changed = true;
  } else {
    const targetTneRender = ',t==="telegram"&&r.jsx("div",{className:"space-y-4"';
    const newTneRender = ',t==="reels_studio"&&r.jsx(window.ReelsMarketingStudio,{}),t==="telegram"&&r.jsx("div",{className:"space-y-4"';
    if (code.includes(targetTneRender) && !code.includes('t==="reels_studio"')) {
      code = code.replace(targetTneRender, newTneRender);
      changed = true;
      console.log('[Reels Studio Patch] Added t==="reels_studio" render inside tne');
    }
  }

  if (changed) {
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('[Reels Studio Patch] Successfully saved patched file:', targetPath);
    return true;
  } else {
    console.log('[Reels Studio Patch] No modifications needed or patterns not found in:', targetPath);
    return false;
  }
}

// Clean duplicate or corrupted declarations directly from files
function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Strip any leading ReelsMarketingStudio / window.ReelsMarketingStudio definitions up to SupplierRestockManager
  if (code.includes('const SupplierRestockManager = () => {')) {
    const idx = code.indexOf('const SupplierRestockManager = () => {');
    if (idx > 0) {
      code = code.substring(idx);
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('[Clean] Cleaned leading declarations before SupplierRestockManager in:', filePath);
      return;
    }
  }

  // Remove any old const declaration blocks if present
  const declPattern = /const ReelsMarketingStudio\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\};\n*/g;
  if (declPattern.test(code)) {
    code = code.replace(declPattern, '');
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('[Clean] Removed duplicate const declaration in:', filePath);
  }
}

const filesToClean = [
  path.join(__dirname, '../public/assets/index-BvHT743v.js'),
  path.join(__dirname, '../dist/assets/index-BvHT743v.js')
];

for (const f of filesToClean) {
  cleanFile(f);
  patchBundleWithReelsStudio(f);
}
