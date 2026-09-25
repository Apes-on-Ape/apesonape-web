import { shortAddress } from './format';

type Props = {
	addresses: string[];
	aliases: Record<string, string>;
	copiedAddress: string | null;
	unlinkingAddress: string | null;
	editingAddress: string | null;
	draft: string;
	saving: boolean;
	message: string | null;
	removable: (address: string) => boolean;
	relationLabel?: (address: string) => string;
	publicState?: (address: string) => boolean | null;
	onCopy: (address: string) => void;
	onLink: () => void;
	onRemove: (address: string) => void;
	onEdit: (address: string) => void;
	onDraft: (value: string) => void;
	onSave: (address: string) => void;
	onCancel: () => void;
	onClear: (address: string) => void;
};

export default function ProfileWalletSummary({
	addresses,
	aliases,
	copiedAddress,
	unlinkingAddress,
	editingAddress,
	draft,
	saving,
	message,
	removable,
	relationLabel,
	publicState,
	onCopy,
	onLink,
	onRemove,
	onEdit,
	onDraft,
	onSave,
	onCancel,
	onClear,
}: Props) {
	return (
		<section id="profile-wallets">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<p className="text-[14px] text-[var(--ink-dim)]">
					{addresses.length ? `${addresses.length} connected` : 'None connected'}
				</p>
				<button type="button" onClick={onLink} className="aoa-home-cta aoa-home-cta-solid">
					{addresses.length ? '+ Link another wallet' : 'Link wallet'}
				</button>
			</div>
			<p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--ink-mute)]">Connect another wallet you control to include its AOA Apes in your profile.</p>
			{addresses.length ? (
				<ul className="mt-4">
					{addresses.map((address) => {
						const alias = aliases[address.toLowerCase()] || '';
						const editing = editingAddress === address;
						return (
							<li key={address} className="mt-3 border border-white/10 bg-black/30 p-4">
								{editing ? (
									<form
										onSubmit={(event) => {
											event.preventDefault();
											onSave(address);
										}}
										className="flex flex-wrap items-end gap-3"
									>
										<label className="block min-w-[16rem] flex-1">
											<span className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-mute)]">Wallet name</span>
											<input
												value={draft}
												onChange={(event) => onDraft(event.target.value)}
												maxLength={32}
												autoFocus
												aria-label="Wallet name"
												className="mt-2 w-full border border-white/15 bg-black/50 px-3 py-3 text-base text-[var(--ink)] focus:border-[var(--signal)] focus:outline-none"
											/>
										</label>
										<button type="submit" disabled={saving} className="aoa-home-cta aoa-home-cta-solid disabled:opacity-40">Save</button>
										<button type="button" onClick={onCancel} className="aoa-home-cta aoa-home-cta-ghost">Cancel</button>
									</form>
								) : (
									<div>
										<p className="text-base font-semibold text-[var(--ink)]">{alias || (addresses[0] === address ? 'Main wallet' : 'Wallet')}</p>
										<p className="mt-1 font-mono text-[13px] text-[var(--ink-mute)]">{shortAddress(address)}</p>
										<p className="mt-2 text-[12px] tracking-[0.12em] uppercase text-[var(--ink-dim)]">{relationLabel ? relationLabel(address) : addresses[0] === address ? 'Primary wallet' : 'Linked wallet'}</p>
										{publicState && publicState(address) != null ? (
											<p className="mt-1 text-[13px] text-[var(--ink-mute)]">Public profile: {publicState(address) ? 'On' : 'Off'}</p>
										) : null}
										<div className="mt-4 flex flex-wrap gap-2">
											<button type="button" onClick={() => onCopy(address)} className="aoa-home-cta aoa-home-cta-ghost">
												{copiedAddress === address ? 'Copied' : 'Copy address'}
											</button>
											<button type="button" onClick={() => onEdit(address)} className="aoa-home-cta aoa-home-cta-ghost">
												{alias ? 'Edit name' : 'Add name'}
											</button>
											{alias ? (
												<button type="button" onClick={() => onClear(address)} disabled={saving} className="aoa-meta px-2 text-[var(--ink-mute)] disabled:opacity-40">
													Clear name
												</button>
											) : null}
										</div>
										{removable(address) ? (
											<button
												type="button"
												onClick={() => onRemove(address)}
												disabled={unlinkingAddress === address}
												className="aoa-meta mt-4 text-[var(--ink-mute)] disabled:opacity-40"
											>
												{unlinkingAddress === address ? 'Removing' : 'Remove from this account'}
											</button>
										) : null}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			) : (
				<p className="mt-4 text-sm text-[var(--ink-mute)]">No wallet on this profile yet.</p>
			)}
			{message ? <p className="mt-3 text-sm text-red-300">{message}</p> : null}
		</section>
	);
}
