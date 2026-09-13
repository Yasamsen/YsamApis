/**
 * TikTok Downloader API
 * Auto-discovered by SamApi scanner
 */

module.exports = {
  meta: {
    name: 'TikTok Downloader',
    description: 'Download TikTok videos without watermark. Provide a valid TikTok video URL.',
    category: 'Downloader',
    method: 'GET',
    status: 'online',
    featured: true,
    tags: ['tiktok', 'video', 'download'],
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'TikTok video URL'
      }
    ],
    responseExample: {
      status: true,
      creator: 'SamApi',
      result: {
        title: 'Sample TikTok Video',
        author: '@creator',
        duration: 15,
        video: 'https://example.com/video.mp4',
        cover: 'https://example.com/cover.jpg'
      }
    }
  },

  /**
   * Handler function
   * @param {object} params - Query parameters
   * @param {object} req - Express request
   * @returns {Promise<object>}
   */
  async handler(params, req) {
    const { url } = params;

    if (!url) {
      return {
        status: false,
        message: 'Parameter "url" is required'
      };
    }

    // Basic URL validation
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
      return {
        status: false,
        message: 'Invalid TikTok URL'
      };
    }

    // Simulated response (replace with real downloader logic)
    // In production you would call a real TikTok downloader service
    return {
      status: true,
      creator: 'SamApi',
      result: {
        title: 'TikTok Video',
        author: 'TikTok User',
        duration: 12,
        video: 'https://cdn.example.com/tiktok/sample.mp4',
        cover: 'https://cdn.example.com/tiktok/cover.jpg',
        watermark_free: true,
        source: url
      }
    };
  }
};
