import type { PrinterModel } from "./types";

type PrinterIconProps = {
  printer: PrinterModel;
  className?: string;
};

export function PrinterIcon({ printer, className = "" }: PrinterIconProps) {
  return (
    <svg
      className={`printer-icon ${className}`.trim()}
      viewBox="0 0 160 120"
      role="img"
      aria-label={`${printer.brand} ${printer.model}`}
    >
      <defs>
        <linearGradient id="frameGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2d8cff" />
          <stop offset="100%" stopColor="#1d3ccf" />
        </linearGradient>
        <linearGradient id="panelGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#edf3ff" />
          <stop offset="100%" stopColor="#cbd7ff" />
        </linearGradient>
        <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6b547" />
          <stop offset="100%" stopColor="#ef7d00" />
        </linearGradient>
        <linearGradient id="violetGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a67ff" />
          <stop offset="100%" stopColor="#5030e5" />
        </linearGradient>
      </defs>

      <rect x="10" y="12" width="140" height="96" rx="24" className="icon-backplate" />

      {printer.modelId === "bambu_lab_a1" ? <BambuA1 /> : null}
      {printer.modelId === "bambu_lab_p1s" ? <BambuP1S /> : null}
      {printer.modelId === "bambu_lab_x1c" ? <BambuX1C /> : null}
      {printer.modelId === "bambu_lab_x1e" ? <BambuX1E /> : null}
      {printer.modelId === "anycubic_kobra_s1" ? <AnycubicKobraS1 /> : null}
      {printer.modelId === "creality_k2_plus" ? <CrealityK2Plus /> : null}
      {printer.modelId === "sovol_sv08" ? <SovolSV08 /> : null}
      {printer.modelId === "elegoo_saturn_4_ultra_16k" ? <ElegooSaturn4Ultra /> : null}
    </svg>
  );
}

function BambuA1() {
  return (
    <>
      <rect x="30" y="82" width="54" height="10" rx="5" fill="#0d1a3f" />
      <rect x="94" y="68" width="20" height="24" rx="7" fill="url(#amberGlow)" />
      <rect x="38" y="76" width="44" height="6" rx="3" fill="#c6d5ff" />
      <rect x="48" y="24" width="8" height="56" rx="4" fill="url(#frameGlow)" />
      <rect x="48" y="24" width="56" height="8" rx="4" fill="url(#frameGlow)" />
      <rect x="96" y="30" width="8" height="38" rx="4" fill="url(#frameGlow)" />
      <circle cx="104" cy="73" r="7" fill="#192861" />
      <rect x="106" y="30" width="10" height="8" rx="4" fill="url(#panelGlow)" />
    </>
  );
}

function BambuP1S() {
  return (
    <>
      <rect x="42" y="24" width="68" height="64" rx="12" fill="#17224d" stroke="url(#frameGlow)" strokeWidth="4" />
      <rect x="52" y="34" width="48" height="40" rx="8" fill="#edf3ff" />
      <rect x="56" y="78" width="40" height="6" rx="3" fill="#93a7ff" />
      <rect x="114" y="38" width="10" height="30" rx="5" fill="url(#amberGlow)" />
      <rect x="48" y="90" width="56" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function BambuX1C() {
  return (
    <>
      <rect x="42" y="22" width="70" height="68" rx="14" fill="#17224d" stroke="url(#frameGlow)" strokeWidth="4" />
      <rect x="52" y="32" width="50" height="42" rx="8" fill="#edf3ff" />
      <circle cx="119" cy="32" r="8" fill="url(#amberGlow)" />
      <rect x="56" y="80" width="42" height="6" rx="3" fill="#93a7ff" />
      <rect x="48" y="92" width="58" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function BambuX1E() {
  return (
    <>
      <rect x="40" y="22" width="72" height="68" rx="14" fill="#17224d" stroke="url(#frameGlow)" strokeWidth="4" />
      <rect x="50" y="32" width="52" height="42" rx="8" fill="#edf3ff" />
      <rect x="114" y="28" width="10" height="18" rx="5" fill="#0d1a3f" />
      <path d="M119 26 V18" stroke="url(#frameGlow)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="119" cy="16" r="3" fill="#2d8cff" />
      <rect x="56" y="80" width="42" height="6" rx="3" fill="#93a7ff" />
      <rect x="48" y="92" width="58" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function AnycubicKobraS1() {
  return (
    <>
      <path d="M48 34 Q52 24 64 24 H106 Q114 24 118 32 L112 88 H52 Z" fill="#17224d" stroke="url(#frameGlow)" strokeWidth="4" />
      <path d="M58 38 H102 L98 74 H62 Z" fill="#edf3ff" />
      <rect x="70" y="80" width="24" height="6" rx="3" fill="#93a7ff" />
      <rect x="56" y="90" width="52" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function CrealityK2Plus() {
  return (
    <>
      <rect x="36" y="18" width="80" height="76" rx="14" fill="#162145" stroke="url(#frameGlow)" strokeWidth="4" />
      <rect x="48" y="30" width="56" height="48" rx="8" fill="#edf3ff" />
      <rect x="118" y="26" width="12" height="46" rx="6" fill="url(#amberGlow)" />
      <rect x="54" y="84" width="48" height="6" rx="3" fill="#93a7ff" />
      <rect x="44" y="96" width="64" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function SovolSV08() {
  return (
    <>
      <rect x="42" y="24" width="8" height="58" rx="4" fill="url(#frameGlow)" />
      <rect x="110" y="24" width="8" height="58" rx="4" fill="url(#frameGlow)" />
      <rect x="42" y="24" width="76" height="8" rx="4" fill="url(#frameGlow)" />
      <rect x="42" y="78" width="76" height="8" rx="4" fill="url(#frameGlow)" />
      <rect x="54" y="50" width="52" height="18" rx="9" fill="#edf3ff" />
      <rect x="52" y="90" width="56" height="6" rx="3" fill="#0c1738" />
    </>
  );
}

function ElegooSaturn4Ultra() {
  return (
    <>
      <rect x="52" y="18" width="56" height="64" rx="14" fill="url(#violetGlow)" />
      <rect x="44" y="78" width="72" height="18" rx="9" fill="#101b44" />
      <rect x="58" y="86" width="40" height="4" rx="2" fill="#edf3ff" />
      <rect x="64" y="28" width="32" height="40" rx="10" fill="rgba(255,255,255,0.35)" />
    </>
  );
}
