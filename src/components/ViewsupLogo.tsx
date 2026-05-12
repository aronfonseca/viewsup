interface ViewsupLogoProps {
  className?: string;
  size?: number;
}

export const ViewsupLogo = ({ className, size = 32 }: ViewsupLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Viewsup AI logo"
  >
    <rect
      x="60"
      y="60"
      width="80"
      height="80"
      rx="14"
      fill="none"
      stroke="#E8FF47"
      strokeWidth="3.5"
    />
    <polyline
      points="76,108 88,92 100,104 114,84"
      fill="none"
      stroke="#E8FF47"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="114" cy="84" r="5.5" fill="#E8FF47" />
  </svg>
);
