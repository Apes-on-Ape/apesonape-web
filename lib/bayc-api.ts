// BAYC API integration for fetching Bored Ape Yacht Club NFTs from Ethereum
// Contract: 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d

export interface BAYCNFT {
  id: string;
  name: string;
  image: string;
  traits: Array<{
    name: string;
    value: string;
  }>;
}

class BAYCAPI {
  private contractAddress = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
  private rpcUrl = 'https://eth.llamarpc.com'; // Public Ethereum RPC

  async getNFTByTokenId(tokenId: string): Promise<BAYCNFT | null> {
    if (!/^\d+$/.test(tokenId)) return null;

    // Build eth_call for tokenURI(uint256)
    const selector = '0xc87b56dd'; // keccak256("tokenURI(uint256)").slice(0,10)
    const tokenIdHex = BigInt(tokenId).toString(16);
    const padded = tokenIdHex.padStart(64, '0');
    const data = selector + padded;

    type RpcResponse = { jsonrpc: string; id: number; result?: string; error?: { code: number; message: string } };
    const body = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1_000_000),
      method: 'eth_call',
      params: [
        { to: this.contractAddress, data },
        'latest',
      ],
    };

    let res: RpcResponse;
    try {
      const resp = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      res = (await resp.json()) as RpcResponse;
    } catch {
      return null;
    }
    if (!res.result || res.result === '0x') return null;

    // Decode ABI-encoded string
    const tokenUri = this.decodeAbiString(res.result);
    if (!tokenUri) return null;

    // Normalize IPFS gateway and build candidate metadata URLs
    const normalizedBase = this.normalizeIpfsUrl(tokenUri);
    const tokenIdDec = String(tokenId);

    const candidates: string[] = [];
    // Replace common placeholders in base URIs
    const replacedPlaceholders = normalizedBase
      .replace('{id}', tokenIdDec)
      .replace('{tokenId}', tokenIdDec)
      .replace('{token_id}', tokenIdDec);
    if (replacedPlaceholders !== normalizedBase) {
      candidates.push(replacedPlaceholders);
    }

    // If URI likely points to a directory or base (no extension), try appending token paths
    const urlPath = (() => {
      try { return new URL(normalizedBase).pathname; } catch { return normalizedBase; }
    })();
    const lastSegment = urlPath.split('/').pop() || '';
    const hasExt = lastSegment.includes('.') && !lastSegment.endsWith('.');

    candidates.push(normalizedBase);
    if (!hasExt) {
      // Try with "/{id}.json" and "/{id}"
      const sep = normalizedBase.endsWith('/') ? '' : '/';
      candidates.push(`${normalizedBase}${sep}${tokenIdDec}.json`);
      candidates.push(`${normalizedBase}${sep}${tokenIdDec}`);
    }

    // Fetch metadata JSON from candidates in order
    type Metadata = {
      name?: string;
      image?: string;
      image_url?: string;
      imageUrl?: string;
      attributes?: Array<{ trait_type?: string; name?: string; value: string }>;
    };
    let metadata: Metadata | null = null;
    for (const candidate of candidates) {
      try {
        const metaResp = await fetch(candidate, { headers: { accept: 'application/json' } });
        if (metaResp.ok) { metadata = await metaResp.json(); break; }
      } catch {}
    }
    if (!metadata) return null;

    const image = this.normalizeIpfsUrl(metadata.image || metadata.image_url || metadata.imageUrl || '');
    const name = metadata.name || `Bored Ape #${tokenId}`;
    
    // Normalize BAYC attributes
    const traits = (metadata.attributes || []).map((attr) => ({
      name: attr.trait_type || attr.name || 'Trait',
      value: attr.value || '',
    })).filter((t) => t.value);

    return {
      id: `${this.contractAddress}:${tokenId}`,
      name,
      image,
      traits,
    };
  }

  private decodeAbiString(hex: string): string | null {
    try {
      // Strip 0x
      const data = hex.startsWith('0x') ? hex.slice(2) : hex;
      // First 32 bytes: offset (ignore)
      // Next 32 bytes: length
      const lenHex = data.slice(64, 128);
      const len = parseInt(lenHex, 16);
      const strHex = data.slice(128, 128 + len * 2);
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = parseInt(strHex.slice(i * 2, i * 2 + 2), 16);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  }

  private normalizeIpfsUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
    const idx = url.indexOf('/ipfs/');
    if (idx !== -1) {
      return `https://gateway.pinata.cloud${url.slice(idx)}`;
    }
    return url;
  }
}

export const baycAPI = new BAYCAPI();

