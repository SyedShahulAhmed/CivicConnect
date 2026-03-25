import type { ComponentType, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export type LucideIcon = ComponentType<IconProps>;

const createIcon = (paths: Array<JSX.Element>): LucideIcon => {
  const Icon = ({ size = 20, strokeWidth = 2, className, ...props }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths}
    </svg>
  );

  return Icon;
};

export const ArrowLeft = createIcon([
  <path key="1" d="M19 12H5" />,
  <path key="2" d="m12 19-7-7 7-7" />,
]);

export const UserCircle2 = createIcon([
  <circle key="1" cx="12" cy="12" r="9" />,
  <path key="2" d="M15 15.5a4.2 4.2 0 0 0-6 0" />,
  <circle key="3" cx="12" cy="10" r="2.5" />,
]);

export const Mail = createIcon([
  <rect key="1" x="3" y="5" width="18" height="14" rx="2" />,
  <path key="2" d="m4 7 8 6 8-6" />,
]);

export const ShieldCheck = createIcon([
  <path key="1" d="M12 3 5 6v6c0 4.5 2.8 7.7 7 9 4.2-1.3 7-4.5 7-9V6l-7-3Z" />,
  <path key="2" d="m9.5 12 1.8 1.8L15 10" />,
]);

export const LockKeyhole = createIcon([
  <rect key="1" x="4" y="11" width="16" height="10" rx="2" />,
  <path key="2" d="M8 11V8a4 4 0 1 1 8 0v3" />,
  <circle key="3" cx="12" cy="16" r="1" />,
  <path key="4" d="M12 17v2" />,
]);

export const SlidersHorizontal = createIcon([
  <path key="1" d="M4 7h9" />,
  <path key="2" d="M4 17h5" />,
  <path key="3" d="M15 7h5" />,
  <path key="4" d="M11 17h9" />,
  <circle key="5" cx="14" cy="7" r="2" />,
  <circle key="6" cx="10" cy="17" r="2" />,
]);

export const MoonStar = createIcon([
  <path key="1" d="M20 13.5A7.5 7.5 0 1 1 10.5 4a6 6 0 0 0 9.5 9.5Z" />,
  <path key="2" d="M18 3v4" />,
  <path key="3" d="M16 5h4" />,
]);

export const Save = createIcon([
  <path key="1" d="M5 21h14a1 1 0 0 0 1-1V8.5L15.5 4H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1Z" />,
  <path key="2" d="M8 21v-6h8v6" />,
  <path key="3" d="M8 4v5h6" />,
]);

export const LoaderCircle = createIcon([
  <path key="1" d="M21 12a9 9 0 1 1-6.2-8.6" />,
]);

export const CheckCircle2 = createIcon([
  <circle key="1" cx="12" cy="12" r="9" />,
  <path key="2" d="m9 12 2 2 4-4" />,
]);

export const AlertCircle = createIcon([
  <circle key="1" cx="12" cy="12" r="9" />,
  <path key="2" d="M12 8v4" />,
  <path key="3" d="M12 16h.01" />,
]);

export const Eye = createIcon([
  <path key="1" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />,
  <circle key="2" cx="12" cy="12" r="3" />,
]);

export const EyeOff = createIcon([
  <path key="1" d="M3 3l18 18" />,
  <path key="2" d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />,
  <path key="3" d="M9.9 5.1A11.3 11.3 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-4.2 4.8" />,
  <path key="4" d="M6.2 6.2A15.2 15.2 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 3-.4" />,
]);
