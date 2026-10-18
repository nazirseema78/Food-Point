// next/image loader: resizes Cloudinary images on their CDN, passes others through.
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const transform = `f_auto,q_${quality ?? "auto"},w_${width},c_limit`;
    return src.replace("/upload/", `/upload/${transform}/`);
  }
  return src;
}
