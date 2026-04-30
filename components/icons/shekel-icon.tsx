import { SVGProps } from 'react'

export function ShekelIcon({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* ₪ — Israeli New Shekel */}
      <path d="M7 18V8a4 4 0 0 1 4-4h2" />
      <path d="M17 6v10a4 4 0 0 1-4 4H11" />
      <line x1="7" y1="11" x2="17" y2="11" />
    </svg>
  )
}
