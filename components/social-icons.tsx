import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react";

export interface SocialIconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  /** Raw color value (hex, rgb(), hsl(), named) used inline. e.g. `#E60023`. */
  color?: string | undefined;
  /** CSS/Tailwind classes; combine with `color` or use on its own, e.g. `text-pink-600`. */
  className?: string | undefined;
  /** Stroke width for stroke-based icons. */
  strokeWidth?: number | undefined;
  /** Pixel (or em) size applied to both width and height. Defaults to `1em`. e.g. `24`, `'2rem'`. */
  size?: number | string | undefined;
}

interface IconBaseProps extends SocialIconProps {
  children: ReactNode;
  viewBox?: string;
  fill?: string;
}

function IconBase({
  children,
  viewBox = "0 0 24 24",
  fill = "none",
  color,
  strokeWidth = 2,
  className,
  style,
  size,
  ...rest
}: IconBaseProps) {
  const dimension = size ?? "1em";
  const resolvedStyle: CSSProperties = {
    color,
    ...style,
  };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox={viewBox}
      className={className}
      style={resolvedStyle}
      fill={fill}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function LinkedinIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="4" cy="4" r="2" />
      <path d="M22 14a6 6 0 0 0-12 0v7h4v-7a2 2 0 0 1 4 0v7h4v-7ZM2 21h4V9H2Z" />
    </IconBase>
  );
}

export function FacebookIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 10h-4V7q0-1 1-1h3V2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3Z" />
    </IconBase>
  );
}

export function InstagramIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <rect width="20" height="20" x="2" y="2" rx="5" />
    </IconBase>
  );
}

export function YoutubeIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M1.4 17q-.9-5 0-10Q1.8 4.8 4 4.5q8-1 16 0q2.2.3 2.6 2.5q.9 5 0 10q-.4 2.2-2.6 2.5q-8 1-16 0q-2.2-.3-2.6-2.5m8.1-8.5v7l6-3.5Z" />
    </IconBase>
  );
}

export function XIcon(props: SocialIconProps) {
  return (
    <IconBase {...props} strokeWidth={1.5}>
      <path d="m19 4l-5.93 6.93M5 20l5.93-6.93m2.14-2.14L7.275 4.343A1.06 1.06 0 0 0 6.481 4H5.007c-.836 0-1.307.85-.793 1.435l6.716 7.635l5.795 6.587c.19.216.483.343.794.343h1.474c.836 0 1.307-.85.793-1.435z" />
    </IconBase>
  );
}

export function PinterestIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="11" />
      <path d="M8.06 22.27L11 11a1 1 0 0 0 5.09 5.39A6 6 0 1 0 6 12" />
    </IconBase>
  );
}

export function TiktokIcon(props: SocialIconProps) {
  return (
    <IconBase {...props} viewBox="0 0 512 512" fill="currentColor" stroke="none">
      <path fillRule="evenodd" d="M345.2 0c8.2 70.4 50.4 120.1 118.7 124.5v66.8h-.4v-56.7C395.2 130.2 356 88.2 347.7 17.8h-72.3V314c10.4 133.3-93.4 137.3-133.2 86.7c46.6 29.1 122.3 10.2 113.3-104.5V0zM151 491c-40.8-8.4-78-32.8-99.8-68.5c-53-86.7-5.2-228 148.5-242.5v83.5h-.3v-62.6C56.9 223.6 42.6 376.6 82.1 440.3c15.2 24.5 40.2 41.8 68.9 50.7" />
      <path fillRule="evenodd" d="M365.9 17.8c5.4 46 24 85.1 55.2 107.9c-42.3-16.3-67-53.7-73.4-107.9zm97.5 126.7c5.8 1.2 11.9 2.1 18.2 2.5v79.2C442 230 407.4 217 367 192.7l6.2 135.6v103.9c0 43.7.2 63.7-23.3 103.9c-52.6 90.2-147.3 97.3-211.4 54.4c83.8 34.6 210.6-7.4 210.3-158.3v-148c40.4 24.3 75 37.3 114.6 33.4zm-264 57.2q12.45-2.55 26.1-3.9v83.5c-33.3 5.5-54.4 15.7-64.3 34.6c-31.1 59.5 9 106.7 53.8 113.8c-52.1 8.7-113.2-44.2-76.8-113.8c9.9-18.9 27.9-29.1 61.2-34.6zm99-183.9h2.8z" />
      <path fillRule="evenodd" d="M347.7 17.8c8.2 70.4 47.5 112.4 115.7 116.8v79.1c-39.6 3.9-74.2-9.1-114.6-33.4v148c.3 193.1-207.4 207.8-266.8 112c-39.5-63.7-25.2-190.7 117.3-239.4v80.4c-33.3 5.5-51.3 15.7-61.2 34.6c-61.1 116.8 152 186.3 137.2-1.9V8.8z" />
    </IconBase>
  );
}

export function GoogleBusinessIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M19.041 3.549A11 11 0 1 0 22.817 10H12v4h6.708a7 7 0 1 1-2.227-7.378Z" />
    </IconBase>
  );
}

export function GoogleBusinessFilledIcon(props: SocialIconProps) {
  return (
    <IconBase {...props} fill="currentColor" stroke="none">
      <path d="M19.041 3.549A11 11 0 1 0 22.817 10H12v4h6.708a7 7 0 1 1-2.227-7.378Z" />
    </IconBase>
  );
}

export function ThreadsIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 8c2-2 7-1 7 4s-5 6-7 4s1-6.4 7-4s2.5 10-4 10S2 16 4 8s14-8 16 0" />
    </IconBase>
  );
}

export function StartPageIcon(props: SocialIconProps) {
  return (
    <IconBase {...props} fill="currentColor" stroke="none">
      <path d="m16.885 14.254l.04-.06a8.7 8.7 0 0 0 1.851-4.309c-1.334 0-2.648 0-3.982.04a4.9 4.9 0 0 1-4.758 3.696a4.95 4.95 0 0 1-4.56-3.044a90 90 0 0 0-3.941.514c1.035 3.697 4.46 6.405 8.501 6.405a8.8 8.8 0 0 0 3.743-.83l.06-.02l.04.04l5.455 6.603c.378.454.916.711 1.513.711c.458 0 .896-.158 1.263-.435c.399-.336.657-.79.697-1.304s-.1-1.009-.438-1.424zM5.118 8.28c.1-2.59 2.27-4.685 4.918-4.685a4.91 4.91 0 0 1 4.898 4.389c1.314.02 2.608.04 3.922.099C18.616 3.717 14.754 0 10.036 0c-4.858 0-8.82 3.934-8.82 8.758v.178a87 87 0 0 1 3.902-.376" />
    </IconBase>
  );
}

export function MastodonIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M15.5 21.5C5 24 3 19 3 13v-3c0-6 2.5-7 7-7h4c4.5 0 7 1.5 7 5.5v4c0 6.5-10 4-13.5 4c-1 0-1.5 7 8 9Z" />
      <path d="M7 13.5v-5.5s.5-2 2.5-2c2 0 2.5 2 2.5 2v.5 2V8s.5-2 2.5-2c2 0 2.5 2 2.5 2v5.5M9.5 12v-3" />
    </IconBase>
  );
}

export function BlueskyIcon(props: SocialIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 10q5-7 8-7t2 6t-6 5q6 1 2 6t-6-3q-2 6-6 3t2-6q-5 1-6-5t2-6t6 7" />
    </IconBase>
  );
}

function SolidIconBase({
  children,
  viewBox = "0 0 24 24",
  color,
  className,
  style,
  size,
  ...rest
}: IconBaseProps) {
  const dimension = size ?? "1em";
  const resolvedStyle: CSSProperties = {
    color,
    ...style,
  };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox={viewBox}
      className={className}
      style={resolvedStyle}
      fill="currentColor"
      stroke="none"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function FacebookSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M232 128a104.16 104.16 0 0 1-91.55 103.26a4 4 0 0 1-4.45-4V152h24a8 8 0 0 0 8-8.53a8.17 8.17 0 0 0-8.25-7.47H136v-24a16 16 0 0 1 16-16h16a8 8 0 0 0 8-8.53a8.17 8.17 0 0 0-8.27-7.47H152a32 32 0 0 0-32 32v24H96a8 8 0 0 0-8 8.53a8.17 8.17 0 0 0 8.27 7.47H120v75.28a4 4 0 0 1-4.44 4a104.15 104.15 0 0 1-91.49-107.19c2-54 45.74-97.9 99.78-100A104.12 104.12 0 0 1 232 128" />
    </SolidIconBase>
  );
}

export function XSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d="M19.57 4.488a.75.75 0 0 0-1.14-.976l-5.368 6.274l-5.224-5.938a1.8 1.8 0 0 0-1.357-.598H5.007c-.68 0-1.264.352-1.56.885a1.55 1.55 0 0 0 .204 1.795l6.286 7.147l-5.507 6.435a.75.75 0 1 0 1.14.976l5.368-6.274l5.224 5.938c.345.392.85.598 1.357.598h1.474c.681 0 1.264-.352 1.56-.885a1.55 1.55 0 0 0-.203-1.795l-6.287-7.146z" />
    </SolidIconBase>
  );
}

export function LinkedinSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M216 24H40a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V40a16 16 0 0 0-16-16M96 176a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Zm-8-80a12 12 0 1 1 12-12a12 12 0 0 1-12 12m96 80a8 8 0 0 1-16 0v-36a20 20 0 0 0-40 0v36a8 8 0 0 1-16 0v-64a8 8 0 0 1 15.79-1.78A36 36 0 0 1 184 140Z" />
    </SolidIconBase>
  );
}

export function InstagramSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M176 24H80a56.06 56.06 0 0 0-56 56v96a56.06 56.06 0 0 0 56 56h96a56.06 56.06 0 0 0 56-56V80a56.06 56.06 0 0 0-56-56m-48 152a48 48 0 1 1 48-48a48.05 48.05 0 0 1-48 48m60-96a12 12 0 1 1 12-12a12 12 0 0 1-12 12m-28 48a32 32 0 1 1-32-32a32 32 0 0 1 32 32" />
    </SolidIconBase>
  );
}

export function YoutubeSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M234.33 69.52a24 24 0 0 0-14.49-16.4C185.56 39.88 131 40 128 40s-57.56-.12-91.84 13.12a24 24 0 0 0-14.49 16.4C19.08 79.5 16 97.74 16 128s3.08 48.5 5.67 58.48a24 24 0 0 0 14.49 16.41C69 215.56 120.4 216 127.34 216h1.32c6.94 0 58.37-.44 91.18-13.11a24 24 0 0 0 14.49-16.41c2.59-10 5.67-28.22 5.67-58.48s-3.08-48.5-5.67-58.48m-73.74 65l-40 28A8 8 0 0 1 108 156v-56a8 8 0 0 1 12.59-6.55l40 28a8 8 0 0 1 0 13.1Z" />
    </SolidIconBase>
  );
}

export function TiktokSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 512 512">
      <path d="M0 0h512v512H0z" fill="none" />
      <path fill="#26f4ee" fillRule="evenodd" d="M345.2 0c8.2 70.4 50.4 120.1 118.7 124.5v66.8h-.4v-56.7C395.2 130.2 356 88.2 347.7 17.8h-72.3V314c10.4 133.3-93.4 137.3-133.2 86.7c46.6 29.1 122.3 10.2 113.3-104.5V0zM151 491c-40.8-8.4-78-32.8-99.8-68.5c-53-86.7-5.2-228 148.5-242.5v83.5h-.3v-62.6C56.9 223.6 42.6 376.6 82.1 440.3c15.2 24.5 40.2 41.8 68.9 50.7" />
      <path fill="#fb2c53" fillRule="evenodd" d="M365.9 17.8c5.4 46 24 85.1 55.2 107.9c-42.3-16.3-67-53.7-73.4-107.9zm97.5 126.7c5.8 1.2 11.9 2.1 18.2 2.5v79.2C442 230 407.4 217 367 192.7l6.2 135.6c0 43.7.2 63.7-23.3 103.9c-52.6 90.2-147.3 97.3-211.4 54.4c83.8 34.6 210.6-7.4 210.3-158.3v-148c40.4 24.3 75 37.3 114.6 33.4zm-264 57.2q12.45-2.55 26.1-3.9v83.5c-33.3 5.5-54.4 15.7-64.3 34.6c-31.1 59.5 9 106.7 53.8 113.8c-52.1 8.7-113.2-44.2-76.8-113.8c9.9-18.9 27.9-29.1 61.2-34.6zm99-183.9h2.8z" />
      <path fillRule="evenodd" d="M347.7 17.8c8.2 70.4 47.5 112.4 115.7 116.8v79.1c-39.6 3.9-74.2-9.1-114.6-33.4v148c.3 193.1-207.4 207.8-266.8 112c-39.5-63.7-25.2-216.7 117.3-239.4v80.4c-33.3 5.5-51.3 15.7-61.2 34.6c-61.1 116.8 152 186.3 137.2-1.9V17.8z" />
    </SolidIconBase>
  );
}

export function ThreadsSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M138.62 128a53.5 53.5 0 0 1 13.1 1.63c-.57 8.21-3.34 15-8.11 19.61A23.9 23.9 0 0 1 127 156c-11.87 0-15-7.58-15-12.07C112 133 125.8 128 138.62 128m85.38 0c0 65.12-35.89 104-96 104s-96-38.88-96-104S67.89 24 128 24s96 38.88 96 104m-152 0c0-43.07 18.32-64 56-64c26.34 0 43 10.08 50.81 30.83a8 8 0 0 0 15-5.66C180.9 55.14 150.9 48 128 48c-26.1 0-45.52 8.7-57.72 25.86C60.8 87.19 56 105.4 56 128s4.8 40.81 14.28 54.14C82.48 199.3 101.9 208 128 208c24.45 0 39.82-8.8 48.41-16.18c10.76-9.25 17.19-21.89 17.19-33.82c0-14.3-6.59-26.79-18.56-35.17a54 54 0 0 0-7.77-4.5c-2.09-14.65-10-25.75-22.34-31.07c-14.5-6.26-32.93-3.33-43.72 6.93a8 8 0 0 0 11 11.62c5.43-5.14 16.79-8 26.4-3.85a20.05 20.05 0 0 1 10.77 10.92a69 69 0 0 0-10.76-.85C113.53 112 96 125.15 96 143.93C96 160.2 109 172 127 172a40 40 0 0 0 27.75-11.29c4.7-4.59 10.11-12.2 12.17-24A25.55 25.55 0 0 1 177.6 158c0 13.71-49.6 34-49.6 34c-37.68 0-56-20.93-56-64" />
    </SolidIconBase>
  );
}

export function MastodonSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d="M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26c-1.31.15-2.6.3-3.97.24c-2.25-.11-4-.54-4-.54v.62c.32 2.22 2.22 2.35 4.03 2.42c1.82.05 3.44-.46 3.44-.46l.08 1.65s-1.28.68-3.55.81c-1.25.07-2.81-.03-4.62-.5c-3.92-1.05-4.6-5.24-4.7-9.5l-.01-3.43c0-4.34 2.83-5.61 2.83-5.61C6.95 2.3 9.41 2 11.97 2h.06c2.56 0 5.02.3 6.47.96c0 0 2.83 1.27 2.83 5.61c0 0 .04 3.21-.39 5.43M18 8.91c0-1.08-.3-1.91-.85-2.56c-.56-.63-1.3-.96-2.23-.96c-1.06 0-1.87.41-2.42 1.23l-.5.88l-.5-.88c-.56-.82-1.36-1.23-2.43-1.23c-.92 0-1.66.33-2.23.96C6.29 7 6 7.83 6 8.91v5.26h2.1V9.06c0-1.06.45-1.62 1.36-1.62c1 0 1.5.65 1.5 1.93v2.79h2.07V9.37c0-1.28.5-1.93 1.51-1.93c.9 0 1.35.56 1.35 1.62v5.11H18z" />
    </SolidIconBase>
  );
}

export function BlueskySolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill="currentColor"
        fillOpacity={0}
        stroke="currentColor"
        strokeDasharray="76"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7.47 5.94c1.83 1.37 3.81 4.14 4.53 5.63c0.72 -1.49 2.7 -4.26 4.53 -5.63c1.33 -0.99 3.47 -1.75 3.47 0.68c0 0.49 -0.28 4.08 -0.45 4.66c-0.57 2.03 -2.65 2.55 -4.5 2.23c3.24 0.55 4.06 2.36 2.28 4.17c-3.38 3.44 -4.85 -0.87 -5.23 -1.97c-0.07 -0.2 -0.1 -0.3 -0.1 -0.22c-0 -0.08 -0.03 0.02 -0.1 0.22c-0.38 1.1 -1.86 5.41 -5.23 1.97c-1.78 -1.81 -0.96 -3.63 2.28 -4.17c-1.85 0.31 -3.93 -0.21 -4.5 -2.23c-0.17 -0.58 -0.45 -4.18 -0.45 -4.66c0 -2.43 2.14 -1.67 3.47 -0.68Z"
      >
        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="76;0" />
        <animate fill="freeze" attributeName="fill-opacity" begin="0.6s" dur="0.4s" to={1} />
      </path>
    </SolidIconBase>
  );
}

export function PinterestSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M240 128.7c-.38 56.49-46.46 102.73-102.94 103.29a104.2 104.2 0 0 1-25.94-3a4 4 0 0 1-2.91-4.86l8.64-34.55A60.6 60.6 0 0 0 144 196c37 0 66.7-33.45 63.81-73.36A72 72 0 1 0 69.24 155A8 8 0 0 0 80 159.29a8.19 8.19 0 0 0 4-10.49a56 56 0 1 1 107.86-24.93C194 154.4 171.73 180 144 180a44.87 44.87 0 0 1-23.14-6.44l14.9-59.62a8 8 0 0 0-15.52-3.88L93.38 217.51a4 4 0 0 1-5.71 2.59A104 104 0 0 1 32 126.88C32.6 70.52 78.67 24.52 135 24a104 104 0 0 1 105 104.7" />
    </SolidIconBase>
  );
}

export function GoogleBusinessSolidIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props} viewBox="0 0 256 256">
      <path d="M0 0h256v256H0z" fill="none" />
      <path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104 104 0 0 0 128 24m0 184a80 80 0 1 1 53.34-139.63a8 8 0 0 1-10.67 11.92A64 64 0 1 0 191.5 136H128a8 8 0 0 1 0-16h72a8 8 0 0 1 8 8a80.09 80.09 0 0 1-80 80" />
    </SolidIconBase>
  );
}

const socialIconSolidComponents: Record<string, ComponentType<SocialIconProps>> = {
  facebook: FacebookSolidIcon,
  instagram: InstagramSolidIcon,
  linkedin: LinkedinSolidIcon,
  youtube: YoutubeSolidIcon,
  x: XSolidIcon,
  twitter: XSolidIcon,
  pinterest: PinterestSolidIcon,
  tiktok: TiktokSolidIcon,
  google_business: GoogleBusinessSolidIcon,
  googlebusiness: GoogleBusinessSolidIcon,
  threads: ThreadsSolidIcon,
  thread: ThreadsSolidIcon,
  mastodon: MastodonSolidIcon,
  bluesky: BlueskySolidIcon,
};

export function HamburgerLeftIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props}>
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12zM3 6h13v2H3zm0 7v-2h10v2zm0 5v-2h13v2z" />
    </SolidIconBase>
  );
}

export function HamburgerRightIcon(props: SocialIconProps) {
  return (
    <SolidIconBase {...props}>
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d="M3 6h10v2H3zm0 10h10v2H3zm0-5h12v2H3zm13-4l-1.42 1.39L18.14 12l-3.56 3.61L16 17l5-5z" />
    </SolidIconBase>
  );
}

/** Renders the solid (filled) social icon for a platform key, or null when unknown. */
export function SocialIconSolid({ name, ...rest }: SocialIconRendererProps) {
  const Component = name ? socialIconSolidComponents[name.toLowerCase()] : undefined;
  if (!Component) return null;
  return <Component {...rest} />;
}

const socialIconComponents: Record<string, ComponentType<SocialIconProps>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  twitter: XIcon,
  pinterest: PinterestIcon,
  tiktok: TiktokIcon,
  google_business: GoogleBusinessIcon,
  googlebusiness: GoogleBusinessIcon,
  threads: ThreadsIcon,
  thread: ThreadsIcon,
  start_page: StartPageIcon,
  startpage: StartPageIcon,
  mastodon: MastodonIcon,
  bluesky: BlueskyIcon,
};

export interface SocialIconRendererProps extends SocialIconProps {
  name?: string;
}

export const SocialIconResolver = socialIconComponents;

export function hasSocialIcon(name?: string): boolean {
  return !!name && name.toLowerCase() in socialIconComponents;
}

/** Renders a specific icon component by name, or null when unknown. */
export function SocialIcon({ name, ...rest }: SocialIconRendererProps) {
  const Component = name ? socialIconComponents[name.toLowerCase()] : undefined;
  if (!Component) return null;
  return <Component {...rest} />;
}
