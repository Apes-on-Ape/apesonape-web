// Magic Eden API integration for Apes On Ape NFT collection
// This service handles fetching NFT data from Magic Eden

export interface MagicEdenNFT {
  id: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  rarity: number;
  traits: Array<{
    name: string;
    value: string;
    rarity: number;
  }>;
  magicEdenUrl: string;
  owner: string;
  lastSale?: {
    price: number;
    currency: string;
    date: string;
  };
}

export interface MagicEdenCollection {
  symbol: string;
  name: string;
  description: string;
  image: string;
  totalSupply: number;
  floorPrice: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  marketCap: number;
}

// Raw attributes as returned by external APIs/metadata
type RawAttributes = Array<{ trait_type?: string; name?: string; value?: string; rarity?: number }>;

class MagicEdenAPI {
  private baseUrl = 'https://api-mainnet.magiceden.dev/v2';
  private collectionSymbol = 'apes-on-apechain'; // Collection page: https://magiceden.io/collections/apechain/apes-on-apechain

  private getEvmContractAddress(): string {
    return '0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0';
  }

  private getApechainRpcUrl(): string {
    return 'https://rpc.apechain.com/http';
  }

  async getCollectionInfo(): Promise<MagicEdenCollection> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${this.collectionSymbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch collection info: ${response.statusText}`);
      }
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        name: data.name,
        description: data.description,
        image: data.image,
        totalSupply: data.totalSupply,
        floorPrice: data.floorPrice,
        volume24h: data.volume24h,
        volume7d: data.volume7d,
        volume30d: data.volume30d,
        marketCap: data.marketCap
      };
    } catch (error) {
      console.error('Error fetching collection info:', error);
      throw error;
    }
  }

  async getNFTs(limit: number = 32, offset: number = 0): Promise<MagicEdenNFT[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.collectionSymbol}/tokens?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      type RawAttributes = Array<{ trait_type?: string; name?: string; value?: string; rarity?: number }>;
      return data.tokens.map((token: Record<string, unknown>) => ({
        id: token.mint,
        name: token.name || `Ape On Ape #${token.tokenId}`,
        image: token.image,
        price: token.price || 0,
        currency: token.currency || 'APE',
        rarity: token.rarity || Math.floor(Math.random() * 1000) + 1,
        traits: this.normalizeAttributes(((token as { attributes?: RawAttributes }).attributes) || []),
        magicEdenUrl: `https://magiceden.us/item-details/${token.mint}`,
        owner: token.owner,
        lastSale: token.lastSale ? {
          price: (token.lastSale as Record<string, unknown>).price as number,
          currency: (token.lastSale as Record<string, unknown>).currency as string,
          date: (token.lastSale as Record<string, unknown>).date as string
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      // Return mock data as fallback
      return this.getMockNFTs(limit);
    }
  }

  async getRandomNFTs(count: number = 32): Promise<MagicEdenNFT[]> {
    try {
      // Get total supply first
      const collectionInfo = await this.getCollectionInfo();
      const totalSupply = collectionInfo.totalSupply;
      
      // Generate random offsets
      const offsets = Array.from({ length: count }, () => 
        Math.floor(Math.random() * Math.max(1, totalSupply - count))
      );
      
      // Fetch NFTs from random positions
      const promises = offsets.map(offset => this.getNFTs(1, offset));
      const results = await Promise.all(promises);
      
      return results.flat();
    } catch (error) {
      console.error('Error fetching random NFTs:', error);
      return this.getMockNFTs(count);
    }
  }

  async getNFTById(id: string): Promise<MagicEdenNFT | null> {
    try {
      // If a plain numeric ID is provided, try EVM (Apechain) token lookup using env contract
      if (/^\d+$/.test(id)) {
        const evm = await this.getEvmNFTByTokenId(id);
        if (evm) return evm;
      }

      const urls = [
        `${this.baseUrl}/tokens/${id}`,
        `https://api-mainnet.magiceden.io/v2/tokens/${id}`,
      ];

      type TokenResponse = {
        mint: string;
        name?: string;
        tokenId?: string;
        image: string;
        price?: number;
        currency?: string;
        rarity?: number;
        attributes?: Array<{ trait_type?: string; name?: string; value: string; rarity?: number }>;
        owner: string;
        lastSale?: { price: number; currency: string; date: string };
      };
      let token: TokenResponse | null = null;
      for (const u of urls) {
        try {
          const resp = await fetch(u, { headers: { 'accept': 'application/json' } });
          if (resp.ok) {
            token = await resp.json();
            break;
          }
        } catch {}
      }
      if (!token) return null;
      
      return {
        id: token.mint,
        name: token.name || `Ape On Ape #${token.tokenId}`,
        image: token.image,
        price: token.price || 0,
        currency: token.currency || 'APE',
        rarity: token.rarity || Math.floor(Math.random() * 1000) + 1,
        traits: this.normalizeAttributes(((token as { attributes?: RawAttributes }).attributes) || []),
        magicEdenUrl: `https://magiceden.us/item-details/${token.mint}`,
        owner: token.owner,
        lastSale: token.lastSale ? {
          price: (token.lastSale as Record<string, unknown>).price as number,
          currency: (token.lastSale as Record<string, unknown>).currency as string,
          date: (token.lastSale as Record<string, unknown>).date as string
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching NFT by ID:', error);
      return null;
    }
  }

  // Public method for numeric token IDs only (Apechain EVM collection)
  // Note: AoA collection uses 1-indexed token IDs for users (token #1 is the first NFT)
  // but the smart contract is 0-indexed (token ID 0 is the first NFT)
  // This method handles the conversion automatically
  async getNFTByTokenId(tokenId: string): Promise<MagicEdenNFT | null> {
    if (!/^\d+$/.test(tokenId)) return null;
    return this.getEvmNFTByTokenId(tokenId);
  }

  private async getEvmNFTByTokenId(tokenId: string): Promise<MagicEdenNFT | null> {
    const contract = this.getEvmContractAddress();
    const rpcUrl = this.getApechainRpcUrl();
    if (!contract || !rpcUrl) return null;

    // AoA collection is 0-indexed in the contract, but users expect 1-indexed IDs
    // So if user searches for token #5, we need to fetch token ID 4 from the contract
    const userFacingTokenId = tokenId;
    const contractTokenId = String(Math.max(0, parseInt(tokenId) - 1));

    // Build eth_call for tokenURI(uint256)
    const selector = '0xc87b56dd'; // keccak256("tokenURI(uint256)").slice(0,10)
    const tokenIdHex = BigInt(contractTokenId).toString(16);
    const padded = tokenIdHex.padStart(64, '0');
    const data = selector + padded;

    type RpcResponse = { jsonrpc: string; id: number; result?: string; error?: { code: number; message: string } };
    const body = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1_000_000),
      method: 'eth_call',
      params: [
        { to: contract, data },
        'latest',
      ],
    };

    let res: RpcResponse;
    try {
      const resp = await fetch(rpcUrl, {
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
    // Use contract token ID for metadata URLs (0-indexed)
    const tokenIdDec = contractTokenId;

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
      attributes?: Array<{ trait_type?: string; name?: string; value: string; rarity?: number }>;
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
    // Use user-facing token ID (1-indexed) for display
    const name = metadata.name || `Ape On Ape #${userFacingTokenId}`;
    return {
      id: `${contract}:${userFacingTokenId}`,
      name,
      image,
      price: 0,
      currency: 'APE',
      rarity: Math.floor(Math.random() * 1000) + 1,
      traits: this.normalizeAttributes(metadata.attributes || []),
      magicEdenUrl: `https://magiceden.us/item-details/apechain/${contract}/${userFacingTokenId}`,
      owner: '',
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

  // Normalize attributes to the internal trait shape
  private normalizeAttributes(attrs: Array<{ trait_type?: string; name?: string; value?: string; rarity?: number }>): MagicEdenNFT['traits'] {
    if (!Array.isArray(attrs)) return [];
    return attrs
      .filter((a) => typeof a?.value === 'string')
      .map((a) => ({
        name: (a.name || a.trait_type || 'Trait') as string,
        value: a.value as string,
        rarity: typeof a.rarity === 'number' ? a.rarity : 0,
      }));
  }

  /**
   * Get token IDs owned by a wallet for the AoA collection (Apechain).
   * Tries Apechain RPC enumeration first, then falls back to Magic Eden API.
   */
  async getWalletTokenIds(wallet: string): Promise<number[]> {
    const contract = this.getEvmContractAddress();
    const rpcUrl = this.getApechainRpcUrl();
    const walletAddr = wallet.startsWith('0x') ? wallet.toLowerCase() : `0x${wallet.toLowerCase()}`;

    // Try RPC enumeration first (if contract supports ERC721Enumerable)
    try {
      const tokenIds = await this.enumerateTokensViaRPC(contract, walletAddr, rpcUrl);
      if (tokenIds.length > 0) {
        return tokenIds;
      }
    } catch (e) {
      console.warn('RPC enumeration failed, trying Magic Eden API:', e);
    }

    // Fallback: Try Magic Eden Apechain-specific endpoint
    try {
      const walletNorm = walletAddr.slice(2).toLowerCase();
      const url = `${this.baseUrl}/apechain/wallets/${walletNorm}/tokens?limit=200&offset=0`;
      const resp = await fetch(url, { headers: { accept: 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        const tokens = Array.isArray(data?.tokens) ? data.tokens : Array.isArray(data) ? data : [];
        const contractLower = contract.toLowerCase();
        const tokenIds: number[] = [];
        for (const t of tokens) {
          const raw = t as Record<string, unknown>;
          const coll = (
            raw.collectionAddress ??
            raw.collection_address ??
            raw.collection ??
            raw.contractAddress ??
            raw.contract ??
            ''
          );
          const collStr = String(coll).toLowerCase();
          if (collStr !== contractLower) continue;
          const id = raw.tokenId ?? raw.token_id ?? raw.id;
          if (id !== undefined && id !== null) {
            const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
            if (!Number.isNaN(num) && num >= 0) tokenIds.push(num);
          }
        }
        if (tokenIds.length > 0) return [...new Set(tokenIds)];
      }
    } catch (e) {
      console.warn('Magic Eden Apechain endpoint failed:', e);
    }

    // Fallback: Try generic Magic Eden wallet endpoint
    const limit = 100;
    const tokenIds: number[] = [];
    const contractLower = contract.toLowerCase();
    for (let offset = 0; offset < 1000; offset += limit) {
      const walletNorm = walletAddr.slice(2).toLowerCase();
      const url = `${this.baseUrl}/wallets/0x${walletNorm}/tokens?limit=${limit}&offset=${offset}`;
      let data: { tokens?: Array<Record<string, unknown>> };
      try {
        const resp = await fetch(url, { headers: { accept: 'application/json' } });
        if (!resp.ok) break;
        data = await resp.json();
      } catch {
        break;
      }
      const tokens = Array.isArray(data?.tokens) ? data.tokens : [];
      if (tokens.length === 0) break;
      for (const t of tokens) {
        const raw = t as Record<string, unknown>;
        const coll = (
          raw.collectionAddress ??
          raw.collection_address ??
          raw.collection ??
          raw.contractAddress ??
          raw.contract ??
          ''
        );
        const collStr = String(coll).toLowerCase();
        if (collStr !== contractLower) continue;
        const id = raw.tokenId ?? raw.token_id ?? raw.id;
        if (id !== undefined && id !== null) {
          const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
          if (!Number.isNaN(num) && num >= 0) tokenIds.push(num);
        }
      }
      if (tokens.length < limit) break;
    }
    return [...new Set(tokenIds)];
  }

  /**
   * Enumerate tokens via Apechain RPC using balanceOf + tokenOfOwnerByIndex (if contract supports it).
   */
  private async enumerateTokensViaRPC(
    contract: string,
    owner: string,
    rpcUrl: string
  ): Promise<number[]> {
    // balanceOf(address) selector: 0x70a08231
    const balanceOfSelector = '0x70a08231';
    const ownerPadded = owner.slice(2).toLowerCase().padStart(64, '0');
    const balanceOfData = balanceOfSelector + ownerPadded;

    type RpcResponse = { jsonrpc: string; id: number; result?: string; error?: { code: number; message: string } };
    const balanceCall: RpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: contract, data: balanceOfData }, 'latest'],
      }),
    }).then((r) => r.json());

    if (!balanceCall.result || balanceCall.result === '0x') return [];
    const balance = parseInt(balanceCall.result, 16);
    if (balance === 0 || balance > 10000) return []; // Sanity check

    // tokenOfOwnerByIndex(address,uint256) selector: 0x2f745c59
    const tokenOfOwnerByIndexSelector = '0x2f745c59';
    const tokenIds: number[] = [];
    const batchSize = 10;

    for (let i = 0; i < balance; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, balance - i) }, (_, j) => i + j);
      const calls = batch.map((index) => {
        const indexHex = BigInt(index).toString(16).padStart(64, '0');
        const data = tokenOfOwnerByIndexSelector + ownerPadded + indexHex;
        return {
          jsonrpc: '2.0',
          id: index + 2,
          method: 'eth_call',
          params: [{ to: contract, data }, 'latest'],
        };
      });

      const responses = await Promise.all(
        calls.map((call) =>
          fetch(rpcUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(call),
          }).then((r) => r.json() as Promise<RpcResponse>)
        )
      );

      for (const res of responses) {
        if (res.result && res.result !== '0x') {
          const tokenId = parseInt(res.result, 16);
          if (!Number.isNaN(tokenId) && tokenId >= 0) {
            tokenIds.push(tokenId);
          }
        }
      }
    }

    return tokenIds;
  }

  async searchNFTs(query: string, limit: number = 32): Promise<MagicEdenNFT[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.collectionSymbol}/tokens?search=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search NFTs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.tokens.map((token: Record<string, unknown>) => ({
        id: token.mint,
        name: token.name || `Ape On Ape #${token.tokenId}`,
        image: token.image,
        price: token.price || 0,
        currency: token.currency || 'APE',
        rarity: token.rarity || Math.floor(Math.random() * 1000) + 1,
        traits: token.attributes || [],
        magicEdenUrl: `https://magiceden.us/item-details/${token.mint}`,
        owner: token.owner,
        lastSale: token.lastSale ? {
          price: (token.lastSale as Record<string, unknown>).price as number,
          currency: (token.lastSale as Record<string, unknown>).currency as string,
          date: (token.lastSale as Record<string, unknown>).date as string
        } : undefined
      }));
    } catch (error) {
      console.error('Error searching NFTs:', error);
      return this.getMockNFTs(limit);
    }
  }

  getMockNFTs(count: number): MagicEdenNFT[] {
    const traits = [
      { name: 'Fur', value: 'Golden', rarity: 10 },
      { name: 'Fur', value: 'Silver', rarity: 25 },
      { name: 'Fur', value: 'Blue', rarity: 50 },
      { name: 'Fur', value: 'Red', rarity: 100 },
      { name: 'Eyes', value: 'Blue', rarity: 30 },
      { name: 'Eyes', value: 'Green', rarity: 40 },
      { name: 'Eyes', value: 'Red', rarity: 20 },
      { name: 'Eyes', value: 'Purple', rarity: 10 },
      { name: 'Accessory', value: 'Crown', rarity: 5 },
      { name: 'Accessory', value: 'Chain', rarity: 15 },
      { name: 'Accessory', value: 'Hat', rarity: 30 },
      { name: 'Accessory', value: 'None', rarity: 50 },
      { name: 'Background', value: 'Space', rarity: 20 },
      { name: 'Background', value: 'Forest', rarity: 30 },
      { name: 'Background', value: 'City', rarity: 25 },
      { name: 'Background', value: 'Ocean', rarity: 25 }
    ];

    return Array.from({ length: count }, (_, i) => {
      const randomTraits = traits
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4) + 2);
      
      return {
        id: `mock-${i + 1}`,
        name: `Ape On Ape #${i + 1}`,
        image: '/AoA-placeholder-apecoinblue.jpg',
        price: Math.random() * 10 + 0.1,
        currency: 'APE',
        rarity: Math.floor(Math.random() * 1000) + 1,
        traits: randomTraits,
        magicEdenUrl: `https://magiceden.us/collections/apechain/0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0/${i + 1}`,
        owner: `0x${Math.random().toString(16).substr(2, 40)}`,
        lastSale: Math.random() > 0.5 ? {
          price: Math.random() * 5 + 0.1,
          currency: 'APE',
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        } : undefined
      };
    });
  }
}

export const magicEdenAPI = new MagicEdenAPI();
