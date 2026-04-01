import { NextRequest, NextResponse } from 'next/server';
import { magicEdenAPI } from '@/lib/magic-eden';

const SUNO_API_KEY = process.env.SUNO_API_KEY || '';
const SUNO_BASE_URL = 'https://api.sunoapi.org';

// Feature flag — flip to true when ready to launch
const FEATURE_ENABLED = false;

export async function POST(req: NextRequest) {
	try {
		// Feature gate — return early while the feature is in staging
		if (!FEATURE_ENABLED) {
			return NextResponse.json(
				{ error: 'Music generation is coming soon. Stay tuned!' },
				{ status: 503 },
			);
		}

		const body = await req.json().catch(() => null);
		if (!body) {
			return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
		}

		const { prompt, style, title, apeId, walletAddress, instrumental = false } = body as {
			prompt?: string;
			style?: string;
			title?: string;
			apeId?: string;
			walletAddress?: string;
			instrumental?: boolean;
		};

		if (!prompt || !apeId) {
			return NextResponse.json({ error: 'Prompt and Ape ID are required.' }, { status: 400 });
		}

		if (!walletAddress) {
			return NextResponse.json(
				{ error: 'Wallet address is required to verify holder status.' },
				{ status: 401 },
			);
		}

		// Verify the wallet holds an AOA Ape
		const tokenIds = await magicEdenAPI.getWalletTokenIds(walletAddress);
		if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
			return NextResponse.json(
				{ error: 'Holders only. No Apes detected for this wallet.' },
				{ status: 403 },
			);
		}

		if (!SUNO_API_KEY) {
			return NextResponse.json(
				{ error: 'SUNO_API_KEY is not configured on the server.' },
				{ status: 500 },
			);
		}

		// Build the sunoapi.org request.
		// Non-custom mode (customMode: false) only requires prompt.
		// Custom mode (customMode: true) requires style + title (+ prompt for lyrics).
		const useCustomMode = !!(style && title);

		const sunoBody: Record<string, unknown> = {
			customMode: useCustomMode,
			instrumental,
			model: 'V4_5',
			// callBackUrl is optional — omit unless you have a webhook endpoint
			callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://apesonape.io'}/api/suno/callback`,
		};

		if (useCustomMode) {
			sunoBody.style = style;
			sunoBody.title = title || `AOA #${apeId}`;
			if (!instrumental) sunoBody.prompt = prompt;
		} else {
			// Non-custom mode: prompt is the only required field (max 500 chars)
			sunoBody.prompt = prompt.slice(0, 500);
		}

		const sunoRes = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SUNO_API_KEY}`,
			},
			body: JSON.stringify(sunoBody),
		});

		const sunoJson = await sunoRes.json().catch(() => ({}));

		if (!sunoRes.ok || sunoJson.code !== 200) {
			console.error('SUNO API error', sunoRes.status, sunoJson);
			return NextResponse.json(
				{
					error: sunoJson.msg || `SUNO API error (${sunoRes.status})`,
					details: sunoJson,
				},
				{ status: 502 },
			);
		}

		// sunoapi.org returns { code: 200, data: { taskId: string } }
		return NextResponse.json(
			{ jobId: sunoJson.data?.taskId ?? null },
			{ status: 200 },
		);
	} catch (err) {
		console.error('SUNO generate error', err);
		return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
	}
}
