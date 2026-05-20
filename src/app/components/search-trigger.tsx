"use client";

import { useSearchModal } from "./search-modal";

export default function SearchTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { open } = useSearchModal();

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}
