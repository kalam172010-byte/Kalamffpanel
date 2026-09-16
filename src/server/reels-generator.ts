import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const reelsGeneratorRouter = express.Router();

interface SceneScript {
  sceneNumber: number;
  timeRange: string; // e.g., "0-10s", "10-20s", "20-30s"
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

function getDefaultReelsScript(
  websiteUrl: string = 'https://kalamffpanel.com',
  websiteName: string = 'KALAM FF PANEL',
  botUsername: string = '@kalam_store_bot',
  productFocus: string = 'Free Fire Keys & VIP Panels',
  tone: string = 'high-energy'
): ReelsGenerationResult {
  const cleanBot = botUsername.startsWith('@') ? botUsername : `@${botUsername}`;
  return {
    reelTopic: `${productFocus} Instant Delivery via Website & Telegram Bot`,
    targetAudience: 'Free Fire gamers, esports players, and resellers in Tamil Nadu & India',
    scenes: [
      {
        sceneNumber: 1,
        timeRange: '0 - 10 Seconds',
        title: 'Hook & Problem (டென்ஷன் இல்லாம Instant Key வேணுமா?)',
        visualHookTamil: 'கேமர் மொபைல் விளையாடும் கேமிங் ரூம் பேக்கிரவுண்ட். அதிரடியான ஜூம்-இன் மற்றும் ஆக்ஷன் எஃபெக்ட்.',
        visualHookEnglish: 'Dynamic zoom into a young gamer playing Free Fire on smartphone in a neon RGB studio setup with vibrant text pop-ins.',
        onScreenTextTamil: 'Instant Free Fire Keys வேணுமா? ⚡',
        onScreenTextEnglish: 'Looking for Instant Free Fire Keys? ⚡',
        voiceoverScriptTamil: 'Free Fire விளையாடுறீங்களா? Instant-ஆ கீ வாங்க முடியாம வெயிட் பண்ணிட்டு இருக்கீங்களா? இனிமேல் அந்த டென்ஷன் வேணாம்! உடனே Instant டெலிவரி பெற ஒரு அதிரடி வழி இருக்கு!',
        voiceoverScriptEnglish: 'Tired of waiting hours for your Free Fire keys and panel access? Stop dealing with slow manual sellers! There is now a 100% automated, instant solution.',
        pacingNote: 'High energy start, fast cuts, sound effect on text pop-in.'
      },
      {
        sceneNumber: 2,
        timeRange: '10 - 20 Seconds',
        title: 'Feature Showcase (Website + Automated Bot Demo)',
        visualHookTamil: `${websiteName} வெப்சைட் மற்றும் ${cleanBot} பாட்டில் UPI செலுத்தி 2 வினாடியில் Key பெறும் நேரடி UI டெமோ.`,
        visualHookEnglish: `Fast split screen showing ${websiteName} UI and ${cleanBot} delivering an active VIP key right after instant UPI scan.`,
        onScreenTextTamil: '24/7 Automated Bot & Instant UPI Delivery 🔥',
        onScreenTextEnglish: '24/7 Automated Bot & Instant UPI Delivery 🔥',
        voiceoverScriptTamil: `நம்ம ${websiteName} வெப்சைட் மற்றும் 24 மணி நேரமும் இயங்கும் ${cleanBot} மூலமா ஒரே கிளிக்கில் UPI பேமெண்ட் பண்ணி, அடுத்த செகண்டே உங்க கீயை உடனே எடுத்துக்கலாம்! 100% சேஃப் & ஃபாஸ்ட்!`,
        voiceoverScriptEnglish: `With our official ${websiteName} site and 24/7 automated ${cleanBot}, pay easily via UPI and receive your active VIP key in seconds! 100% verified and secure.`,
        pacingNote: 'Quick UI transitions, dynamic finger taps, beat-synced highlights.'
      },
      {
        sceneNumber: 3,
        timeRange: '20 - 30 Seconds',
        title: 'Call-to-Action (Bio Link & Comment Trigger)',
        visualHookTamil: 'அவதார் கை காட்டும் சைகை, ஸ்கிரீனில் பெரிய Telegram & Website லிங்க் பட்டன் மற்றும் Comment "BOT" அனிமேஷன்.',
        visualHookEnglish: 'Avatar gestures toward bio and comment section with animated glowing CTA buttons for Website and Telegram Bot.',
        onScreenTextTamil: 'Check Link in Bio / Comment "BOT" 👇',
        onScreenTextEnglish: 'Check Link in Bio / Comment "BOT" 👇',
        voiceoverScriptTamil: `இப்பவே நம்ம Bio-ல இருக்கிற லிங்கை கிளிக் பண்ணி வெப்சைட்டையோ அல்லது ${cleanBot}-யோ ஸ்டார்ட் பண்ணுங்க! இல்லைனா கமெண்ட்ல "BOT"னு மெசேஜ் பண்ணுங்க, நேரடியா லிங்க் அனுப்புறோம்!`,
        voiceoverScriptEnglish: `Tap the link in our bio right now to visit our website or start ${cleanBot}! Or simply comment "BOT" below to get the link sent directly to your DMs!`,
        pacingNote: 'Strong clear finish, display username and website URL.'
      }
    ],
    aiVideoPrompt: `A charismatic young Indian gamer avatar with neon cyberpunk headset sitting in front of high-end RGB gaming monitors, speaking enthusiastically to camera with dynamic hand gestures, smooth 4K vertical 9:16 aspect ratio, hyper-realistic lip-syncing for reels video.`,
    aiVoiceoverPromptTamil: `Free Fire விளையாடுறீங்களா? Instant-ஆ கீ வாங்க முடியாம வெயிட் பண்ணிட்டு இருக்கீங்களா? இனிமேல் அந்த டென்ஷன் வேணாம்! \n\nநம்ம ${websiteName} வெப்சைட் மற்றும் 24 மணி நேரமும் இயங்கும் ${cleanBot} மூலமா ஒரே கிளிக்கில் UPI பேமெண்ட் பண்ணி, அடுத்த செகண்டே உங்க கீயை உடனே எடுத்துக்கலாம்! 100% சேஃப் & ஃபாஸ்ட்! \n\nஇப்பவே நம்ம Bio-ல இருக்கிற லிங்கை கிளிக் பண்ணுங்க அல்லது கமெண்ட்ல BOT-னு டைப் பண்ணுங்க, நேரடியா லிங்க் அனுப்புறோம்!`,
    aiVoiceoverPromptEnglish: `Tired of waiting hours for your Free Fire keys and panel access? Stop dealing with slow manual sellers!\n\nWith our official ${websiteName} website and 24/7 automated ${cleanBot}, pay easily via UPI and get your active VIP keys delivered instantly in seconds!\n\nTap the link in our bio right now or comment "BOT" below to receive the direct link in your DMs!`,
    instagramCaptionTamil: `Free Fire Instant Keys & 24/7 Bot Delivery ⚡🎮\n\nஇனிமேல் வெயிட் பண்ண தேவையில்லை! Instant UPI delivery & 24/7 automated bot support.\n\n👉 Website: ${websiteUrl}\n🤖 Telegram Bot: ${cleanBot}\n\n💬 கமெண்ட்ல "BOT"னு டைப் பண்ணுங்க, உடனே லிங்க் DM-க்கு வரும்!\n🔗 Bio-ல இருக்கிற லிங்கை கிளிக் பண்ணி இப்போதே பாருங்க!`,
    instagramCaptionEnglish: `Instant Free Fire Keys & 24/7 Bot Delivery ⚡🎮\n\nNo more waiting! Instant UPI delivery & automated Telegram Bot support 24/7.\n\n👉 Website: ${websiteUrl}\n🤖 Telegram Bot: ${cleanBot}\n\n💬 Comment "BOT" below for instant DM link!\n🔗 Click the link in bio to get started now!`,
    hashtags: [
      '#FreeFireTamil',
      '#FreeFireIndia',
      '#FFPanel',
      '#GamingTamil',
      '#TelegramBot',
      '#InstantDelivery',
      '#TamilGamer',
      '#FFMod'
    ],
    tips: [
      'Record or screen-capture the exact moment of key delivery in Telegram bot (0.5s cut) for maximum proof.',
      'Use trending background audio with a high-energy beat drop around the 10th second.',
      'Place all critical on-screen text in the 4:5 safe center area so Instagram UI icons do not cover it.',
      'Set up an automated DM reply tool (like ManyChat or IG Quick Replies) for the keyword "BOT".'
    ]
  };
}

// POST /api/admin/reels/generate
reelsGeneratorRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      websiteName = 'KALAM FF PANEL',
      websiteUrl = 'https://kalamffpanel.com',
      botUsername = '@kalam_store_bot',
      botFeatures = 'Instant automated key delivery, UPI wallet deposits, 24/7 support',
      productFocus = 'Free Fire Keys, Injectors & VIP Panels',
      targetAudience = 'Tamil Free Fire gamers, tournament players & resellers',
      tone = 'high-energy gaming style',
      customNotes = ''
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback to rich template generation if API key is not yet set in environment
      const defaultScript = getDefaultReelsScript(websiteUrl, websiteName, botUsername, productFocus, tone);
      return res.json({
        success: true,
        source: 'template-engine',
        data: defaultScript,
        message: 'Reels script generated successfully using high-converting marketing template.'
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a viral Instagram marketing strategist and Tamil copywriter specializing in gaming apps, digital key stores, and Telegram automated bots.
Generate a high-converting 30-second Instagram Reel script broken into exactly three 10-second scenes (Scene 1: 0-10s, Scene 2: 10-20s, Scene 3: 20-30s).
The primary spoken language MUST be natural, engaging colloquial Tamil (spoken Tamil suitable for Indian gamers / Tamil Nadu audience) along with an accurate English translation.

Store & Bot Details:
- Website Name: ${websiteName}
- Website URL: ${websiteUrl}
- Telegram Bot: ${botUsername}
- Bot & Website Features: ${botFeatures}
- Product Focus: ${productFocus}
- Target Audience: ${targetAudience}
- Video Tone: ${tone}
- Extra Custom Instructions: ${customNotes || 'Focus on speed, 24/7 automated bot, and instant UPI payment'}

Format your entire response strictly as a JSON object with this exact structure:
{
  "reelTopic": "...",
  "targetAudience": "...",
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0 - 10 Seconds",
      "title": "Hook & Problem (Tamil & English description)",
      "visualHookTamil": "...",
      "visualHookEnglish": "...",
      "onScreenTextTamil": "...",
      "onScreenTextEnglish": "...",
      "voiceoverScriptTamil": "...",
      "voiceoverScriptEnglish": "...",
      "pacingNote": "..."
    },
    {
      "sceneNumber": 2,
      "timeRange": "10 - 20 Seconds",
      "title": "Feature Showcase (Website + Bot Demo)",
      "visualHookTamil": "...",
      "visualHookEnglish": "...",
      "onScreenTextTamil": "...",
      "onScreenTextEnglish": "...",
      "voiceoverScriptTamil": "...",
      "voiceoverScriptEnglish": "...",
      "pacingNote": "..."
    },
    {
      "sceneNumber": 3,
      "timeRange": "20 - 30 Seconds",
      "title": "Call-to-Action (Bio Link & Comment Trigger)",
      "visualHookTamil": "...",
      "visualHookEnglish": "...",
      "onScreenTextTamil": "...",
      "onScreenTextEnglish": "...",
      "voiceoverScriptTamil": "...",
      "voiceoverScriptEnglish": "...",
      "pacingNote": "..."
    }
  ],
  "aiVideoPrompt": "English prompt for HeyGen/Kling/Runway avatar video...",
  "aiVoiceoverPromptTamil": "Continuous 30-second spoken Tamil script for ElevenLabs/Murf AI...",
  "aiVoiceoverPromptEnglish": "Continuous 30-second English voiceover script...",
  "instagramCaptionTamil": "Engaging caption in Tamil with emojis and CTA...",
  "instagramCaptionEnglish": "Engaging caption in English...",
  "hashtags": ["#FreeFireTamil", "#FreeFireIndia", ...],
  "tips": ["Tip 1...", "Tip 2...", "Tip 3..."]
}

Ensure the Tamil spoken dialogue is natural, snappy, energetic, and perfectly timed for 10 seconds per scene.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        source: 'gemini-ai',
        data: parsedData,
        message: 'Reels script generated successfully with Gemini AI.'
      });
    } catch (aiErr: any) {
      console.warn('[Reels API] Gemini call failed, falling back to marketing template:', aiErr?.message);
      const fallbackScript = getDefaultReelsScript(websiteUrl, websiteName, botUsername, productFocus, tone);
      return res.json({
        success: true,
        source: 'template-fallback',
        data: fallbackScript,
        message: 'Reels script generated successfully.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate Reels script'
    });
  }
});
