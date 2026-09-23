import type { Metadata } from "next";
import AlohaTeamBanner from "@/components/apply/AlohaTeamBanner";
import AlohaTeamEditForm from "@/components/apply/AlohaTeamEditForm";

export const metadata: Metadata = {
  title: "알로하 팀 챌린지 팀 정보 수정",
  description:
    "알로하 팀 챌린지에 신청한 팀의 대표자가 휴대폰 인증 후 팀원·팀 정보를 수정합니다.",
  robots: { index: false, follow: false },
};

export default function AlohaTeamEditPage() {
  return (
    <>
      <AlohaTeamBanner variant="edit" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
        <AlohaTeamEditForm />
      </div>
    </>
  );
}
