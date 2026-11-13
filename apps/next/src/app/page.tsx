import { DEFAULT_BG, DEFAULT_FG, hexFromParam } from "@contrast-check/core";
import { ContrastChecker } from "@/components/contrast-checker";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <ContrastChecker
      initialFg={hexFromParam(params.fg) ?? DEFAULT_FG}
      initialBg={hexFromParam(params.bg) ?? DEFAULT_BG}
    />
  );
}
