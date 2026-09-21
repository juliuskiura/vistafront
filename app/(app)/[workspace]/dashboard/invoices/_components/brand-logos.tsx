/** Brand lockups for the checkout (Visa / M-PESA / PayPal) plus the
 * decorative chip & contactless marks used on the Visa card preview.
 * Ported verbatim from `payment-method-choice/src/components/BrandLogos.tsx`. */

export function VisaLogo({
  className = "h-6 w-auto",
  variant = "colored",
}: {
  className?: string;
  variant?: "colored" | "white";
}) {
  if (variant === "white") {
    return (
      <svg
        viewBox="0 0 100 32"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="5"
          y="25"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="28"
          letterSpacing="1"
        >
          VISA
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vistafront-visaBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A1F71" />
          <stop offset="100%" stopColor="#0E4595" />
        </linearGradient>
      </defs>
      <path d="M12 9 L28 31 L38 9 L26 9 L21 23 L16 9 Z" fill="#F7B600" />
      <text
        x="28"
        y="29"
        fill="url(#vistafront-visaBlue)"
        fontFamily="'Outfit', 'Inter', system-ui, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="30"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

export function MpesaLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vistafront-mpesaGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00A34E" />
          <stop offset="100%" stopColor="#00C853" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="5"
        width="40"
        height="30"
        rx="8"
        fill="url(#vistafront-mpesaGreen)"
      />
      <path
        d="M11 27 V14 L17 21 L23 14 V27"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="15" r="3" fill="#E51C24" />
      <text
        x="50"
        y="27"
        fill="#00A34E"
        fontFamily="'Outfit', sans-serif"
        fontWeight="800"
        fontSize="19"
        letterSpacing="0.05em"
      >
        M-PESA
      </text>
    </svg>
  );
}

export function PaypalLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 36"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vistafront-ppDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#002F86" />
          <stop offset="100%" stopColor="#001C66" />
        </linearGradient>
        <linearGradient id="vistafront-ppLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0079C1" />
          <stop offset="100%" stopColor="#00457C" />
        </linearGradient>
      </defs>
      <g transform="translate(4, 2)">
        <path
          d="M10 2H22C26.5 2 29.5 5 29.5 9.5C29.5 15.5 25.5 19 20 19H14.5L12 32H5L10 2Z"
          fill="url(#vistafront-ppDark)"
        />
        <path
          d="M17 9H27C31 9 33.5 11.8 33.5 15.8C33.5 21.5 29.5 25 24 25H19.5L17.5 35H12L17 9Z"
          fill="url(#vistafront-ppLight)"
          fillOpacity="0.92"
        />
      </g>
      <text
        x="46"
        y="25"
        fill="#002F86"
        fontFamily="'Outfit', sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-0.02em"
      >
        Pay<tspan fill="#0079C1">Pal</tspan>
      </text>
    </svg>
  );
}

export function ChipIcon({ className = "w-10 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="42"
        height="30"
        rx="6"
        fill="#D4AF37"
        stroke="#A88B27"
        strokeWidth="1"
      />
      <path d="M1 11 H14 V21 H1" stroke="#846C1C" strokeWidth="1" strokeLinecap="round" />
      <path d="M43 11 H30 V21 H43" stroke="#846C1C" strokeWidth="1" strokeLinecap="round" />
      <path d="M14 1 V11 H30 V1" stroke="#846C1C" strokeWidth="1" strokeLinecap="round" />
      <path d="M14 31 V21 H30 V31" stroke="#846C1C" strokeWidth="1" strokeLinecap="round" />
      <circle cx="22" cy="16" r="3.5" fill="#C59B27" />
    </svg>
  );
}

export function ContactlessWave({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M8 8.5C9.5 10 9.5 14 8 15.5" />
      <path d="M11.5 6C14 8.5 14 15.5 11.5 18" />
      <path d="M15 3.5C18.5 6.5 18.5 17.5 15 20.5" />
    </svg>
  );
}