import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import ApplyForm from "@/components/apply/ApplyForm";

export const metadata: Metadata = {
  title: "교육 접수",
  description:
    "양양군서핑협회 심판/강사 인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다.",
  alternates: { canonical: "https://ysa-website.vercel.app/apply" },
};

export default function ApplyPage() {
  return (
    <>
      <PageHeader
        title="교육 접수"
        description="양양군서핑협회 심판/강사 인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다."
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "교육 접수" },
        ]}
      />
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <ApplyForm />
      </section>
    </>
  );
}
