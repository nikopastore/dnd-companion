import { CharacterBuilderScreen } from "@/components/builder/character-builder-screen";

interface BuilderPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CharacterBuilderPage({ searchParams }: BuilderPageProps) {
  const params = (await searchParams) ?? {};
  const campaignId =
    typeof params.campaignId === "string" ? params.campaignId : undefined;
  const campaignName =
    typeof params.campaignName === "string" ? params.campaignName : undefined;

  return (
    <CharacterBuilderScreen
      initialCampaignId={campaignId}
      initialCampaignName={campaignName}
    />
  );
}
