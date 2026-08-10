import zlib from 'zlib';

export const hasher = (url: string) => {
  return zlib.crc32(url).toString(16).padStart(8, '0').slice(0, 7);
};