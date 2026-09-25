import type { ReactNode } from 'react';

export default function ProfileFrame({ children }: { children: ReactNode }) {
	return (
		<main className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(var(--aoa-dock-offset)+2.5rem)] pt-[calc(var(--aoa-header-h)+1.75rem)] sm:px-6 lg:px-10">
			{children}
		</main>
	);
}
