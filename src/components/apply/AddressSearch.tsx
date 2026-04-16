"use client";

import { useEffect, useRef, useState } from "react";

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

interface DaumPostcodeCtor {
  new (config: {
    oncomplete: (data: DaumPostcodeData) => void;
    onclose: () => void;
  }): { embed: (element: HTMLElement) => void };
}

function getPostcode(): DaumPostcodeCtor | undefined {
  return (window as unknown as { daum?: { Postcode?: DaumPostcodeCtor } })
    .daum?.Postcode;
}

interface Props {
  value: string;
  detailValue: string;
  onChange: (address: string) => void;
  onDetailChange: (detail: string) => void;
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function AddressSearch({
  value,
  detailValue,
  onChange,
  onDetailChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.getElementById("daum-postcode-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  function openPostcode() {
    const Postcode = getPostcode();
    if (!scriptLoaded || !Postcode) return;
    setIsOpen(true);
    setTimeout(() => {
      if (!embedRef.current) return;
      new Postcode({
        oncomplete(data: DaumPostcodeData) {
          const addr = data.roadAddress || data.jibunAddress;
          const fullAddr = data.zonecode ? `(${data.zonecode}) ${addr}` : addr;
          onChange(fullAddr);
          setIsOpen(false);
        },
        onclose() {
          setIsOpen(false);
        },
      }).embed(embedRef.current);
    }, 100);
  }

  const inputCls =
    "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="주소 검색을 클릭해주세요"
          value={value}
          readOnly
          onClick={openPostcode}
          className={`${inputCls} flex-1 cursor-pointer bg-gray-50`}
        />
        <button
          type="button"
          onClick={openPostcode}
          disabled={!scriptLoaded}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <SearchIcon className="w-4 h-4" />
          주소 검색
        </button>
      </div>

      {isOpen && (
        <div
          className="border border-gray-300 rounded-lg overflow-hidden"
          style={{ height: 400 }}
        >
          <div ref={embedRef} style={{ width: "100%", height: "100%" }} />
        </div>
      )}

      {value && (
        <input
          type="text"
          placeholder="상세주소 입력 (동/호수 등)"
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}
