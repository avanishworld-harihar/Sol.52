import { PP_BORDER } from "@/lib/proposal-premium-design";

export function NextgenHorizontalRule({ className }: { className?: string }) {
  return <hr className={className} style={{ border: 0, borderTop: `1px solid ${PP_BORDER}`, margin: 0 }} />;
}

export function NextgenVerticalRule({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ width: 1, alignSelf: "stretch", backgroundColor: PP_BORDER }}
      aria-hidden
    />
  );
}
