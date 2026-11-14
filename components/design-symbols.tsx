import Image from "next/image";
type IllustrationName = "pair" | "pointer-hand" | "twocards" | "scale-empty" | "scale-stone" | "ladder" | "reader" | "torn" | "drawer" | "shelf" | "flag" | "hand" | "peek" | "clerk-card";

// Display supplied artwork and explicitly approved generated replacements. Missing assets stay absent.
const originalImages: Partial<Record<IllustrationName, string>> = {
 "pair": "/design/illustrations/pair.png",
 "pointer-hand": "/design/illustrations/pointer-hand.png",
 "peek": "/design/illustrations/peek.png",
 "clerk-card": "/design/illustrations/clerk-card.png",
 "ladder": "/design/illustrations/ladder-clean-v1.png",
 "scale-stone": "/design/illustrations/scale-stone.png",
 "drawer": "/design/illustrations/drawer.png",
 "scale-empty": "/design/illustrations/scale-empty.png",
 "twocards": "/design/illustrations/twocards.png",
 "torn": "/design/illustrations/torn.png",
 "shelf": "/design/illustrations/shelf.png",
 "reader": "/design/illustrations/reader.png",
 "flag": "/design/illustrations/flag.png",
 "hand": "/design/illustrations/hand.png",
};
// CSS viewports remove only spare canvas. Original bitmap files stay unchanged.
// The replacement ladder uses its complete canvas; no watermark cropping or retouching.
const imageViewports: Record<IllustrationName, readonly [number, number, number, number]> = {
 "pair": [145, 727, 2608, 1418],
 "pointer-hand": [849, 1575, 220, 365],
 "peek": [1125, 724, 633, 1449],
 "clerk-card": [273, 411, 2242, 2125],
 "ladder": [0, 0, 1254, 1254],
 "scale-stone": [309, 855, 2385, 1192],
 "drawer": [328, 769, 2207, 1392],
 "scale-empty": [342, 799, 2253, 1340],
 "twocards": [314, 466, 2254, 1748],
 "torn": [275, 712, 2280, 1374],
 "shelf": [152, 341, 2582, 2072],
 "reader": [274, 525, 2330, 1723],
 "flag": [725, 708, 1529, 1527],
 "hand": [1035, 695, 904, 1404],
};
export function WloIllustration({name,width=120,className="",alt=""}:{name:IllustrationName;width?:number;className?:string;alt?:string}) {
 const source = originalImages[name];
 if (!source) return null;
 const [left,top,cropWidth,cropHeight]=imageViewports[name];
 const nativeSize=name==="pointer-hand"?2048:name==="ladder"?1254:2880;
 const frameStyle={"--illo-width":`${width}px`,aspectRatio:`${cropWidth} / ${cropHeight}`} as const;
 const imageStyle={position:"absolute",left:`${-left/cropWidth*100}%`,top:`${-top/cropHeight*100}%`,width:`${nativeSize/cropWidth*100}%`,height:"auto",maxWidth:"none",mixBlendMode:"multiply",pointerEvents:"none"} as const;
 return <span className={`wlo-illustration illo-frame illo-${name} ${className}`} style={frameStyle} aria-hidden={alt?undefined:true}>
  {/* Preserve the source PNG and CSS viewport; serve a size-matched copy to avoid multi-megabyte downloads. */}
  <Image className="illo" src={source} width={nativeSize} height={nativeSize} sizes={`${Math.ceil(width*nativeSize/cropWidth)}px`} quality={85} alt={alt} loading="lazy" decoding="async" style={imageStyle}/>
 </span>;
}
export function WloMark(){return <svg className="wlo-mark" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="16" height="2"/><rect x="4" y="3" width="2" height="11"/><rect x="4" y="12" width="16" height="2"/><rect x="7" y="7" width="9" height="4"/><rect x="4" y="17" width="9" height="4"/></svg>}
