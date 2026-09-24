import { redirect } from 'next/navigation';

// /about has been redirected to /story
export default function AboutPage() {
  redirect('/story');
}
