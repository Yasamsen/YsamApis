module.exports = {
  meta: {
    name: 'Instagram Downloader',
    description: 'Download Instagram posts, reels, and stories. Supports photo and video.',
    category: 'Downloader',
    method: 'GET',
    status: 'online',
    featured: true,
    tags: ['instagram', 'download', 'reels'],
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Instagram post/reel URL'
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Media type preference (photo, video, all)',
        default: 'all'
      }
    ],
    responseExample: {
      status: true,
      creator: 'SamApi',
      result: {
        type: 'video',
        media: ['https://example.com/ig.mp4'],
        caption: 'Sample Instagram post'
      }
    }
  },

  async handler(params) {
    const { url, type = 'all' } = params;

    if (!url) {
      return { status: false, message: 'Parameter "url" is required' };
    }

    if (!url.includes('instagram.com')) {
      return { status: false, message: 'Invalid Instagram URL' };
    }

    return {
      status: true,
      creator: 'SamApi',
      result: {
        type: type === 'photo' ? 'photo' : 'video',
        media: ['https://cdn.example.com/instagram/sample.mp4'],
        caption: 'Downloaded from Instagram',
        source: url
      }
    };
  }
};
