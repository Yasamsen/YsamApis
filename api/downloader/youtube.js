module.exports = {
  meta: {
    name: 'YouTube Downloader',
    description: 'Download YouTube videos and audio. Supports various quality options.',
    category: 'Downloader',
    method: 'GET',
    status: 'online',
    featured: true,
    tags: ['youtube', 'video', 'audio', 'download'],
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'YouTube video URL'
      },
      {
        name: 'quality',
        type: 'string',
        required: false,
        description: 'Video quality (360, 480, 720, 1080)',
        default: '720'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Output format (mp4, mp3, webm)',
        default: 'mp4'
      }
    ],
    responseExample: {
      status: true,
      creator: 'SamApi',
      result: {
        title: 'Sample YouTube Video',
        quality: '720p',
        format: 'mp4',
        download: 'https://example.com/yt.mp4'
      }
    }
  },

  async handler(params) {
    const { url, quality = '720', format = 'mp4' } = params;

    if (!url) {
      return { status: false, message: 'Parameter "url" is required' };
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return { status: false, message: 'Invalid YouTube URL' };
    }

    return {
      status: true,
      creator: 'SamApi',
      result: {
        title: 'YouTube Video',
        quality: quality + 'p',
        format,
        duration: '3:45',
        download: `https://cdn.example.com/youtube/sample_${quality}.${format}`,
        source: url
      }
    };
  }
};
