export interface MediaItem {
  url: string;
  filename: string;
}

export interface Folder {
  name: string;
}

const USER = 'Yasamsen';
const REPO = 'media-repo';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${USER}/${REPO}/contents/`;
const RAW_BASE = `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/`;

export function isImageFile(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(url);
}

export function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(url);
}

export async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch folders');
  const data = await res.json();
  const folders = (data as Array<{ type: string; name: string }>)
    .filter((f) => f.type === 'dir')
    .map((f) => ({ name: f.name }));
  return folders;
}

export async function fetchFolderMedia(folder: string): Promise<MediaItem[]> {
  const res = await fetch(RAW_BASE + folder + '/api.json');
  if (!res.ok) throw new Error('Failed to fetch folder media');
  const json = await res.json();
  const links: string[] = json.data || [];
  return links.map((url) => ({
    url,
    filename: url.split('/').pop() || 'file',
  }));
}

const blobCache = new Map<string, string>();

export async function getBlobUrl(url: string): Promise<string> {
  const cached = blobCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  blobCache.set(url, blobUrl);
  return blobUrl;
}

export async function downloadMedia(url: string): Promise<void> {
  const blobUrl = await getBlobUrl(url);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = url.split('/').pop() || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
