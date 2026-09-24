export type HttpMethod = 'GET' | 'POST';

export interface ApiParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
  example?: string;
}

export interface ApiResponseField {
  name: string;
  type: string;
  description: string;
}

export interface ApiDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  method: HttpMethod;
  endpoint: string;
  icon: string;
  parameters: ApiParameter[];
  responseExample: Record<string, unknown>;
  responseFields: ApiResponseField[];
  exampleRequest: string;
}

export const apiDefinitions: ApiDefinition[] = [
  {
    slug: 'instagram',
    name: 'Instagram Downloader',
    description: 'Download photos, videos, reels, and stories from Instagram links with high quality output.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/instagram',
    icon: 'Instagram',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The Instagram post, reel, or story URL to download from.',
        example: 'https://www.instagram.com/reel/XXXXXXX/',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'instagram',
        type: 'reel',
        media: [
          {
            url: 'https://cdn.instagram.com/media.mp4',
            thumbnail: 'https://cdn.instagram.com/thumb.jpg',
            type: 'video',
            quality: 'HD',
          },
        ],
        author: { username: '@username', name: 'User Name' },
        caption: 'Sample caption text',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.platform', type: 'string', description: 'Source platform name.' },
      { name: 'data.type', type: 'string', description: 'Type of media (post, reel, story).' },
      { name: 'data.media', type: 'array', description: 'Array of downloadable media objects.' },
      { name: 'data.media[].url', type: 'string', description: 'Direct download URL.' },
      { name: 'data.media[].thumbnail', type: 'string', description: 'Thumbnail image URL.' },
      { name: 'data.author', type: 'object', description: 'Author profile information.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/instagram?url=https://www.instagram.com/reel/XXXXXXX/',
  },
  {
    slug: 'tiktok',
    name: 'TikTok Downloader',
    description: 'Download TikTok videos without watermark in HD, including audio extraction support.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/tiktok',
    icon: 'Music2',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The TikTok video URL to download.',
        example: 'https://www.tiktok.com/@user/video/XXXXXXX',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'tiktok',
        title: 'Sample TikTok Video',
        author: { username: '@creator', nickname: 'Creator', avatar: 'https://cdn.tiktok.com/avatar.jpg' },
        media: [
          { url: 'https://cdn.tiktok.com/video-no-wm.mp4', type: 'video', quality: 'HD', noWatermark: true },
          { url: 'https://cdn.tiktok.com/audio.mp3', type: 'audio' },
        ],
        statistics: { plays: 1200000, likes: 240000, comments: 5600, shares: 12000 },
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.title', type: 'string', description: 'Video title/caption.' },
      { name: 'data.author', type: 'object', description: 'Creator profile information.' },
      { name: 'data.media', type: 'array', description: 'Array of downloadable media (video + audio).' },
      { name: 'data.statistics', type: 'object', description: 'Video engagement statistics.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/tiktok?url=https://www.tiktok.com/@user/video/XXXXXXX',
  },
  {
    slug: 'youtube',
    name: 'YouTube Downloader',
    description: 'Download YouTube videos in multiple resolutions, extract audio as MP3, and fetch metadata.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/youtube',
    icon: 'Youtube',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The YouTube video URL.',
        example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        name: 'quality',
        type: 'string',
        required: false,
        description: 'Preferred video quality (144p, 360p, 720p, 1080p).',
        example: '1080p',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        title: 'Sample YouTube Video',
        author: 'Channel Name',
        duration: '3:32',
        thumbnail: 'https://cdn.youtube.com/thumb.jpg',
        formats: [
          { quality: '1080p', url: 'https://cdn.youtube.com/1080.mp4', type: 'video', size: '45.2 MB' },
          { quality: '720p', url: 'https://cdn.youtube.com/720.mp4', type: 'video', size: '28.1 MB' },
          { quality: 'mp3', url: 'https://cdn.youtube.com/audio.mp3', type: 'audio', size: '5.1 MB' },
        ],
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.videoId', type: 'string', description: 'YouTube video ID.' },
      { name: 'data.title', type: 'string', description: 'Video title.' },
      { name: 'data.duration', type: 'string', description: 'Video duration.' },
      { name: 'data.formats', type: 'array', description: 'Available download formats with direct URLs.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=1080p',
  },
  {
    slug: 'facebook',
    name: 'Facebook Downloader',
    description: 'Download Facebook videos in HD or SD quality from public posts and reels.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/facebook',
    icon: 'Facebook',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The Facebook video URL.',
        example: 'https://www.facebook.com/watch?v=XXXXXXX',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'facebook',
        title: 'Sample Facebook Video',
        author: 'Page Name',
        thumbnail: 'https://cdn.facebook.com/thumb.jpg',
        media: [
          { quality: 'HD', url: 'https://cdn.facebook.com/hd.mp4', type: 'video' },
          { quality: 'SD', url: 'https://cdn.facebook.com/sd.mp4', type: 'video' },
        ],
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.title', type: 'string', description: 'Video title.' },
      { name: 'data.author', type: 'string', description: 'Uploader page name.' },
      { name: 'data.media', type: 'array', description: 'Available video qualities with download URLs.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/facebook?url=https://www.facebook.com/watch?v=XXXXXXX',
  },
  {
    slug: 'spotify',
    name: 'Spotify Downloader',
    description: 'Download tracks and fetch metadata from Spotify links including album art and artist info.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/spotify',
    icon: 'Music',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The Spotify track, album, or playlist URL.',
        example: 'https://open.spotify.com/track/XXXXXXX',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'spotify',
        type: 'track',
        title: 'Sample Track',
        artists: ['Artist Name'],
        album: 'Album Name',
        releaseDate: '2024-01-15',
        duration: '3:45',
        cover: 'https://cdn.spotify.com/cover.jpg',
        preview: 'https://cdn.spotify.com/preview.mp3',
        download: 'https://cdn.spotify.com/track.mp3',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.type', type: 'string', description: 'Content type (track, album, playlist).' },
      { name: 'data.title', type: 'string', description: 'Track or album title.' },
      { name: 'data.artists', type: 'array', description: 'List of artist names.' },
      { name: 'data.cover', type: 'string', description: 'Album cover image URL.' },
      { name: 'data.download', type: 'string', description: 'Direct download URL for the track.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/spotify?url=https://open.spotify.com/track/XXXXXXX',
  },
  {
    slug: 'twitter',
    name: 'Twitter/X Downloader',
    description: 'Download videos and GIFs from Twitter/X posts in original quality.',
    category: 'Downloader',
    method: 'GET',
    endpoint: '/api/twitter',
    icon: 'Twitter',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The Twitter/X post URL containing media.',
        example: 'https://twitter.com/user/status/XXXXXXX',
      },
    ],
    responseExample: {
      success: true,
      data: {
        platform: 'twitter',
        author: '@username',
        text: 'Sample tweet text',
        media: [
          { type: 'video', url: 'https://cdn.twitter.com/video.mp4', quality: 'original' },
          { type: 'image', url: 'https://cdn.twitter.com/image.jpg' },
        ],
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.author', type: 'string', description: 'Tweet author handle.' },
      { name: 'data.text', type: 'string', description: 'Tweet text content.' },
      { name: 'data.media', type: 'array', description: 'Media attachments with download URLs.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/twitter?url=https://twitter.com/user/status/XXXXXXX',
  },
  {
    slug: 'ai-chat',
    name: 'AI Chat',
    description: 'Send prompts to an AI model and receive intelligent text responses with context awareness.',
    category: 'AI',
    method: 'POST',
    endpoint: '/api/ai-chat',
    icon: 'Bot',
    parameters: [
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'The prompt or question to send to the AI.',
        example: 'What is the capital of Indonesia?',
      },
      {
        name: 'model',
        type: 'string',
        required: false,
        description: 'AI model to use (gpt-4, llama, gemini).',
        example: 'gpt-4',
      },
    ],
    responseExample: {
      success: true,
      data: {
        model: 'gpt-4',
        response: 'The capital of Indonesia is Jakarta.',
        usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.model', type: 'string', description: 'AI model used for the response.' },
      { name: 'data.response', type: 'string', description: 'AI-generated text response.' },
      { name: 'data.usage', type: 'object', description: 'Token usage statistics.' },
    ],
    exampleRequest: 'POST https://samapi.example.com/api/ai-chat\nContent-Type: application/json\n\n{"message":"What is the capital of Indonesia?","model":"gpt-4"}',
  },
  {
    slug: 'ai-image',
    name: 'AI Image Generator',
    description: 'Generate images from text descriptions using advanced diffusion models.',
    category: 'AI',
    method: 'POST',
    endpoint: '/api/ai-image',
    icon: 'ImagePlus',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        required: true,
        description: 'Text description of the image to generate.',
        example: 'A serene mountain lake at sunset',
      },
      {
        name: 'size',
        type: 'string',
        required: false,
        description: 'Image dimensions (256x256, 512x512, 1024x1024).',
        example: '1024x1024',
      },
    ],
    responseExample: {
      success: true,
      data: {
        url: 'https://cdn.samapi.com/generated/image.png',
        size: '1024x1024',
        seed: 42,
        created: '2024-01-15T10:30:00Z',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.url', type: 'string', description: 'URL of the generated image.' },
      { name: 'data.size', type: 'string', description: 'Image dimensions.' },
      { name: 'data.seed', type: 'number', description: 'Random seed used for generation.' },
    ],
    exampleRequest: 'POST https://samapi.example.com/api/ai-image\nContent-Type: application/json\n\n{"prompt":"A serene mountain lake at sunset","size":"1024x1024"}',
  },
  {
    slug: 'qrcode',
    name: 'QR Code Generator',
    description: 'Generate QR codes from any text, URL, or data with customizable size and color.',
    category: 'Utility',
    method: 'GET',
    endpoint: '/api/qrcode',
    icon: 'QrCode',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text or URL to encode into the QR code.',
        example: 'https://example.com',
      },
      {
        name: 'size',
        type: 'number',
        required: false,
        description: 'QR code size in pixels (default 300).',
        example: '500',
      },
    ],
    responseExample: {
      success: true,
      data: {
        url: 'https://cdn.samapi.com/qr/XXXX.png',
        text: 'https://example.com',
        size: 500,
        format: 'png',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.url', type: 'string', description: 'URL of the generated QR code image.' },
      { name: 'data.text', type: 'string', description: 'Encoded text content.' },
      { name: 'data.size', type: 'number', description: 'Image size in pixels.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/qrcode?text=https://example.com&size=500',
  },
  {
    slug: 'weather',
    name: 'Weather Info',
    description: 'Get current weather conditions and forecasts for any city worldwide.',
    category: 'Utility',
    method: 'GET',
    endpoint: '/api/weather',
    icon: 'CloudSun',
    parameters: [
      {
        name: 'city',
        type: 'string',
        required: true,
        description: 'City name to get weather for.',
        example: 'Jakarta',
      },
      {
        name: 'units',
        type: 'string',
        required: false,
        description: 'Temperature units (metric, imperial).',
        example: 'metric',
      },
    ],
    responseExample: {
      success: true,
      data: {
        city: 'Jakarta',
        country: 'Indonesia',
        temperature: 31,
        condition: 'Partly Cloudy',
        humidity: 75,
        windSpeed: 12,
        forecast: [
          { day: 'Mon', high: 32, low: 25, condition: 'Sunny' },
          { day: 'Tue', high: 30, low: 24, condition: 'Rain' },
        ],
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.city', type: 'string', description: 'City name.' },
      { name: 'data.temperature', type: 'number', description: 'Current temperature.' },
      { name: 'data.condition', type: 'string', description: 'Weather condition description.' },
      { name: 'data.forecast', type: 'array', description: 'Multi-day forecast array.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/weather?city=Jakarta&units=metric',
  },
  {
    slug: 'ip-lookup',
    name: 'IP Address Lookup',
    description: 'Lookup geolocation, ISP, and network information for any IP address.',
    category: 'Utility',
    method: 'GET',
    endpoint: '/api/ip-lookup',
    icon: 'Globe',
    parameters: [
      {
        name: 'ip',
        type: 'string',
        required: false,
        description: 'IP address to lookup (defaults to caller IP if omitted).',
        example: '8.8.8.8',
      },
    ],
    responseExample: {
      success: true,
      data: {
        ip: '8.8.8.8',
        city: 'Mountain View',
        region: 'California',
        country: 'United States',
        countryCode: 'US',
        latitude: 37.3861,
        longitude: -122.084,
        timezone: 'America/Los_Angeles',
        isp: 'Google LLC',
        org: 'Google LLC',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.ip', type: 'string', description: 'Queried IP address.' },
      { name: 'data.city', type: 'string', description: 'City name.' },
      { name: 'data.country', type: 'string', description: 'Country name.' },
      { name: 'data.isp', type: 'string', description: 'Internet Service Provider.' },
    ],
    exampleRequest: 'https://samapi.example.com/api/ip-lookup?ip=8.8.8.8',
  },
  {
    slug: 'text-to-speech',
    name: 'Text to Speech',
    description: 'Convert text into natural-sounding speech audio in multiple languages and voices.',
    category: 'Utility',
    method: 'POST',
    endpoint: '/api/tts',
    icon: 'Volume2',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text to convert to speech.',
        example: 'Hello, welcome to SamApi.',
      },
      {
        name: 'lang',
        type: 'string',
        required: false,
        description: 'Language code (en, id, ja, etc.).',
        example: 'en',
      },
    ],
    responseExample: {
      success: true,
      data: {
        url: 'https://cdn.samapi.com/tts/XXXX.mp3',
        text: 'Hello, welcome to SamApi.',
        lang: 'en',
        duration: '2.1s',
      },
    },
    responseFields: [
      { name: 'success', type: 'boolean', description: 'Whether the request succeeded.' },
      { name: 'data.url', type: 'string', description: 'URL of the generated audio file.' },
      { name: 'data.lang', type: 'string', description: 'Language used for synthesis.' },
      { name: 'data.duration', type: 'string', description: 'Audio duration.' },
    ],
    exampleRequest: 'POST https://samapi.example.com/api/tts\nContent-Type: application/json\n\n{"text":"Hello, welcome to SamApi.","lang":"en"}',
  },
];

export function getApiBySlug(slug: string): ApiDefinition | undefined {
  return apiDefinitions.find((api) => api.slug === slug);
}

export function getCategories(): string[] {
  return [...new Set(apiDefinitions.map((a) => a.category))];
}
