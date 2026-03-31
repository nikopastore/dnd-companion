import type { CharacterSummary } from "./character";

export type CampaignStatus = "LOBBY" | "ACTIVE" | "ARCHIVED";
export type MemberRole = "PLAYER" | "DM";

export interface CampaignSummary {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  status: CampaignStatus;
  dmName: string;
  memberCount: number;
}

export interface CampaignMemberInfo {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  role: MemberRole;
  character?: CharacterSummary;
}
