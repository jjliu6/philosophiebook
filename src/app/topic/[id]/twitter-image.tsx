// Twitter/X preview image.
//
// Next.js emits `twitter:image` only when a `twitter-image` file convention
// exists — `opengraph-image` alone produces `og:image` (read by Facebook and
// LinkedIn) but NOT `twitter:image`, which is why X showed no preview. We reuse
// the exact same generated image here so X gets a large-image card too.
import OGImage, { size, contentType } from "./opengraph-image";

export const runtime = "nodejs";
export const alt = "PhilosophieBook Topic";
export { size, contentType };

export default OGImage;
