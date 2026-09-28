import { redirect } from 'next/navigation';

/** /comp 자체는 목록 페이지가 없다 — 대회 허브(/festival)로 보낸다 */
export default function CompIndexPage() {
  redirect('/festival');
}
