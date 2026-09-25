import MountCard from "@/components/MountCard";
import { MOUNTS } from "@/lib/mounts";

/** Карточка оснастки — по странице на каждый артикул прайса. */
export function generateStaticParams() {
  return MOUNTS.map((m) => ({ id: m.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase() }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MountCard id={id} />;
}
