import { parsePaletteQuery } from "@contrast-check/core";
import { PaletteApp } from "@/components/palette-app";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { palette, options } = parsePaletteQuery(await searchParams);
  return <PaletteApp palette={palette} options={options} />;
}
