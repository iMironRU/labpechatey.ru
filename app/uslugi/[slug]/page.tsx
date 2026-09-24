import ServicePage from "@/components/ServicePage";
import services from "@/content/services.json";

/** Пять услуг — пять статических страниц, содержимое лежит в content/services.json. */
export function generateStaticParams() {
  return Object.values(services).map((s) => ({ slug: s.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ServicePage slug={slug} />;
}
