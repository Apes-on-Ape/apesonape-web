'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ShoppingBag, X, Search, Filter, Sparkles, Link2, ChevronDown, Crown, Zap, Star, Shield, Circle, Trophy, ChevronLeft, ChevronRight, ArrowUpDown, Users, Layers, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Image from 'next/image';
import SafeImage from '../components/SafeImage';
import Footer from '../components/Footer';
import ScrollToTopButton from '../components/ScrollToTopButton';
// Magic Eden fetching removed in CID mode

// Exclude specific trait types from the filter UI
const EXCLUDED_TRAIT_TYPES = new Set(['Background', 'BG', 'Background Color', 'BackgroundColor']);

// ─── Rarity types & config ────────────────────────────────────────────────────
type Tier = 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';
type TierIcon = React.ComponentType<{ className?: string }>;
type RarityEntry = {
  id: number;
  rank: number;
  score: number;
  tier: Tier;
  traits: Array<{ name: string; value: string; count: number; rarity: number }>;
};
const TIER_CONFIG: Record<Tier, { icon: TierIcon; color: string; bg: string; border: string; glow: string }> = {
  Legendary: { icon: Crown,  color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  glow: 'shadow-amber-500/20'  },
  Epic:      { icon: Zap,    color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  Rare:      { icon: Star,   color: 'text-hero-blue',   bg: 'bg-hero-blue/10',  border: 'border-hero-blue/40',  glow: 'shadow-hero-blue/20'  },
  Uncommon:  { icon: Shield, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10',border: 'border-accent-cyan/40',glow: 'shadow-accent-cyan/20' },
  Common:    { icon: Circle, color: 'text-white/50',    bg: 'bg-white/5',       border: 'border-white/15',      glow: ''                     },
};
const TIERS: Tier[] = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
const CDN_THUMB_RARITY = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';
const RARITY_LIMIT = 24;

// Fixed collection: only this metadata CID is used
const DEFAULT_METADATA_CID = process.env.NEXT_PUBLIC_DEFAULT_METADATA_CID || 'bafybeiaizsmuaj5ubnsh6mtb53ngqffyhrqus7kdqihfbtbafq4c75gjny';
// Optional CDN base for prebuilt indices (e.g., Supabase Storage public URL ending with /collection-index/)
const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';
// CDN thumbnails base (512px WebP), uploaded by the thumbnail builder
const THUMBS_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

// Preferred IPFS gateways (first has priority; client-side image fallback will rotate on failure)
const IPFS_GATEWAYS = [
  // Allow overriding with a custom Pinata subdomain gateway
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PINATA_SUBDOMAIN_GATEWAY : undefined) || 'https://moccasin-brilliant-silkworm-382.mypinata.cloud/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://nftstorage.link/ipfs',
  'https://dweb.link/ipfs',
] as const;

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const observerTarget = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  // Incremented every time active filters/search change so stale observer callbacks abort
  const filterGenRef = useRef(0);
  // Tracks all token IDs already added to driveItems — prevents duplicates across effect re-runs
  const plannedIdsRef = useRef<Set<string>>(new Set());

  // State
  // Drive-backed gallery items
  type DriveItem = {
    id: string;
    name: string;
    imageUrl: string;
    imageUrls?: string[]; // fallback candidates across gateways
    tokenId?: string;
    traits?: { name: string; value: string; rarity: number }[];
  };
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalItem, setModalItem] = useState<DriveItem | null>(null);
  const [modalRarity, setModalRarity] = useState<RarityEntry | null>(null);
  const [modalRarityLoading, setModalRarityLoading] = useState(false);
  // Total count for the collection; avoid keeping 10k items in memory at once
  const [totalCount, setTotalCount] = useState<number>(0);
  // Track last token id we've planned into driveItems (absolute token id, not index). -1 means none.
  const [plannedUntil, setPlannedUntil] = useState<number>(-1);

  // Filters from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'token-asc' | 'token-desc'>(
    (searchParams.get('sort') as 'token-asc' | 'token-desc') || 'token-asc'
  );
  // Trait filters by type: AND across types, OR within a type
  type SelectedByType = Record<string, Set<string>>;
  const [selectedByType, setSelectedByType] = useState<SelectedByType>({});
  // Filter for trait types list
  const [typeFilterTerm, setTypeFilterTerm] = useState('');
  // Accordion expand state per type
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  // Per-type value search
  const [perTypeSearch, setPerTypeSearch] = useState<Record<string, string>>({});

  const itemsPerPage = 50;

  // Tracks the last set of filter criteria (excludes driveItems / plannedUntil so that
  // planning more items doesn't reset pagination back to page 1)
  const prevFilterCriteriaRef = useRef({ searchTerm: '', sortBy: 'token-asc' as string, selKey: '', cdnIdx: null as typeof cdnTraitIndex });

  // Local search input for token ID
  const [idQuery, setIdQuery] = useState<string>('');
  const OPENSEA_COLLECTION_URL = 'https://opensea.io/collection/apes-on-apechain';

  // ── View mode: browse vs rarity ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'browse' | 'rarity'>('browse');

  // ── Rarity state ──────────────────────────────────────────────────────────
  const [rarityEntries, setRarityEntries] = useState<RarityEntry[]>([]);
  const [rarityTotal, setRarityTotal] = useState(0);
  const [rarityPage, setRarityPage] = useState(1);
  const [rarityPages, setRarityPages] = useState(1);
  const [rarityLoading, setRarityLoading] = useState(false);
  const [raritySearch, setRaritySearch] = useState('');
  const [rarityDebouncedSearch, setRarityDebouncedSearch] = useState('');
  const [rarityActiveTier, setRarityActiveTier] = useState<Tier | ''>('');
  const [tierCounts, setTierCounts] = useState<Record<Tier, number>>({} as Record<Tier, number>);

  // Dynamic trait types discovered from metadata
  const [traitTypes, setTraitTypes] = useState<string[]>([]);
  const seenTraitTypesRef = useRef<Set<string>>(new Set());
  // Available values per type discovered from loaded metadata
  const [availableValuesByType, setAvailableValuesByType] = useState<Record<string, Set<string>>>({});
  // Cache of traits by tokenId for reliable filtering without mutating all items repeatedly
  const traitsCacheRef = useRef<Record<string, { name: string; value: string; rarity: number }[]>>({});
  const [traitsVersion, setTraitsVersion] = useState(0); // bump to recompute derived state
  // Guard against duplicate metadata fetches per token
  const fetchedMetaRef = useRef<Set<string>>(new Set());

  // Optional CDN indices (loaded when CDN_BASE present)
  const [cdnTokensById, setCdnTokensById] = useState<Record<string, { image: string; attributes: Array<Record<string, unknown>> }> | null>(null);
  const [cdnTraitIndex, setCdnTraitIndex] = useState<Record<string, Record<string, number[]>> | null>(null);
  const [cdnTraitsMeta, setCdnTraitsMeta] = useState<{ types: string[]; valuesByType: Record<string, string[]>; counts: Record<string, Record<string, number>> } | null>(null);

  useEffect(() => {
    if (!CDN_BASE) return;
    let cancelled = false;
    (async () => {
      try {
        const base = CDN_BASE.replace(/\/+$/, '');
        const [tokensRes, traitsRes, indexRes] = await Promise.all([
          fetch(`${base}/tokens.json`, { cache: 'force-cache' }),
          fetch(`${base}/traits.json`, { cache: 'force-cache' }),
          fetch(`${base}/traitIndex.json`, { cache: 'force-cache' }),
        ]);
        if (!tokensRes.ok || !traitsRes.ok || !indexRes.ok) return;
        const [tokens, traitsMeta, traitIndex] = await Promise.all([tokensRes.json(), traitsRes.json(), indexRes.json()]);
        if (cancelled) return;
        const byId: Record<string, { image: string; attributes: Array<Record<string, unknown>> }> = {};
        for (const t of tokens as Array<{ id: number; image: string; attributes: Array<Record<string, unknown>> }>) {
          byId[String(t.id)] = { image: t.image || '', attributes: Array.isArray(t.attributes) ? t.attributes : [] };
        }
        setCdnTokensById(byId);
        setCdnTraitIndex(traitIndex || {});
        setCdnTraitsMeta(traitsMeta || null);
        // If traits meta present, prime UI lists
        if (traitsMeta?.types && traitsMeta?.valuesByType) {
          const map: Record<string, Set<string>> = {};
          for (const type of traitsMeta.types) {
            map[type] = new Set(traitsMeta.valuesByType[type] || []);
          }
          setAvailableValuesByType(map);
          const sorted = traitsMeta.types.slice().sort();
          setTraitTypes(sorted);
        }
      } catch {
        // ignore; fallback to IPFS metadata
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Magic Eden live listings and activity removed

  // Update URL with filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'token-asc') params.set('sort', sortBy);
    const traitParam = Object.entries(selectedByType)
      .filter(([, set]) => set.size > 0)
      .map(([type, set]) => `${type}:${Array.from(set).join('|')}`)
      .join(';');
    if (traitParam) params.set('traits', traitParam);
    
    router.push(`/collection?${params.toString()}`, { scroll: false });
  }, [searchTerm, sortBy, selectedByType, router]);

  // Search controls removed; searchTerm remains available via URL if needed

  // Normalize IPFS-like inputs to an array of gateway candidates
  function normalizeToGatewayCandidates(input: string | undefined | null): string[] {
    if (!input) return [];
    try {
      // If it's a full URL already
      if (/^https?:\/\//i.test(input)) {
        const idx = input.indexOf('/ipfs/');
        if (idx !== -1) {
          const path = input.slice(idx + '/ipfs/'.length); // after /ipfs/
          return IPFS_GATEWAYS.map(base => `${base}/${path}`);
        }
        // Not an IPFS URL; return as-is (single candidate)
        return [input];
      }
      // ipfs://<cid>(/path)
      if (input.startsWith('ipfs://')) {
        const cidPath = input.replace('ipfs://', '');
        return IPFS_GATEWAYS.map(base => `${base}/${cidPath}`);
      }
      // Raw CID or CID with path
      if (/^(Qm[A-Za-z0-9]+|bafy[A-Za-z0-9]+)(\/.*)?$/.test(input)) {
        return IPFS_GATEWAYS.map(base => `${base}/${input}`);
      }
      return [input];
    } catch {
      return [input as string];
    }
  }

  // Component to render an image with IPFS gateway fallback rotation
  function FallbackImage({
    srcs,
    alt,
    sizes,
    className,
  }: {
    srcs: string[];
    alt: string;
    sizes?: string;
    className?: string;
  }) {
    const [index, setIndex] = useState(0);
    const activeSrc = srcs[Math.min(index, srcs.length - 1)];
    return (
      <Image
        src={activeSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => {
          setIndex(i => (i + 1 < srcs.length ? i + 1 : i));
        }}
      />
    );
  }

  // Load collection using fixed IPFS metadata CID
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const cid = DEFAULT_METADATA_CID;
        const startId = parseInt(searchParams.get('start') || '0', 10);
        const endParam = searchParams.get('end');
        const countParam = searchParams.get('count');
        const count = countParam ? parseInt(countParam, 10) : 10000;

        let items: DriveItem[] = [];

        if (!cid) {
          // No CID configured; show empty state
          setDriveItems([]);
          setFilteredItems([]);
          setDisplayedItems([]);
          setHasMore(false);
          setTotalCount(0);
          setPlannedUntil(-1);
          return;
        }

        // Strict CID mode: plan incrementally to reduce memory
        const endId = typeof count === 'number'
          ? startId + Math.max(0, count - 1)
          : (endParam ? parseInt(endParam, 10) : startId + 9999);
        const total = endId - startId + 1;
        setTotalCount(total);
        // Seed with the first page only
        const seedEnd = Math.min(startId + itemsPerPage - 1, endId);
        const plannedSeed: DriveItem[] = [];
        plannedIdsRef.current = new Set<string>();
        for (let id = startId; id <= seedEnd; id++) {
          plannedSeed.push({
            id: String(id),
            name: String(id),
            imageUrl: '', // fetched lazily
            tokenId: String(id),
          });
          plannedIdsRef.current.add(String(id));
        }
        items = plannedSeed;
        setPlannedUntil(seedEnd);

        setDriveItems(items);
      } catch (error) {
        console.error('Error loading collection data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Helper: parse attributes into internal trait shape and update caches/sets
  // Stable callback — uses functional updater so it never needs availableValuesByType in deps.
  const applyTraitsToCaches = useCallback((tokenId: string, attributes: Array<Record<string, unknown>>) => {
    type RawAttr = { trait_type?: unknown; type?: unknown; name?: unknown; value?: unknown; trait_value?: unknown };
    const traits = (attributes || [])
      .map((raw: Record<string, unknown>) => {
        const a = raw as RawAttr;
        const nameUnknown = a.trait_type ?? a.type ?? a.name;
        const valueUnknown = a.value ?? a.trait_value ?? '';
        const name = typeof nameUnknown === 'string' ? nameUnknown : (nameUnknown != null ? String(nameUnknown) : '');
        const value = typeof valueUnknown === 'string' ? valueUnknown : (valueUnknown != null ? String(valueUnknown) : '');
        return name && value ? { name, value, rarity: 0 } : null;
      })
      .filter(Boolean) as { name: string; value: string; rarity: number }[];
    if (traits.length === 0) return;
    traitsCacheRef.current[tokenId] = traits;

    // Discover new trait types
    let newTypeFound = false;
    for (const t of traits) {
      if (EXCLUDED_TRAIT_TYPES.has(t.name)) continue;
      if (!seenTraitTypesRef.current.has(t.name)) {
        seenTraitTypesRef.current.add(t.name);
        newTypeFound = true;
      }
    }
    if (newTypeFound) {
      setTraitTypes(Array.from(seenTraitTypesRef.current).sort());
    }

    // Use functional updater — no dependency on availableValuesByType state
    setAvailableValuesByType(prev => {
      const next: Record<string, Set<string>> = { ...prev };
      let changed = false;
      for (const t of traits) {
        if (EXCLUDED_TRAIT_TYPES.has(t.name)) continue;
        if (!next[t.name]) { next[t.name] = new Set<string>(); changed = true; }
        if (!next[t.name].has(t.value)) { next[t.name] = new Set(next[t.name]); next[t.name].add(t.value); changed = true; }
      }
      return changed ? next : prev; // Return same ref if nothing changed
    });
    setTraitsVersion(v => v + 1);
  }, []); // Stable — no external state deps

  // In CID mode, lazily fetch metadata for currently displayed items that are missing image URLs and traits
  useEffect(() => {
    const cid = DEFAULT_METADATA_CID;
    if (!cid) return;
    const gatewayBase = IPFS_GATEWAYS[0];

    let cancelled = false;
    const missing = displayedItems.filter(it => {
      const token = it.tokenId;
      if (!token) return false;
      if (fetchedMetaRef.current.has(token)) return false;
      const haveImage = !!it.imageUrl;
      const haveTraits = !!traitsCacheRef.current[token];
      return !haveImage || !haveTraits;
    });
    if (missing.length === 0) return;

    (async () => {
      const updates: Array<Promise<void>> = [];
      /** Tokens not in `cdnTokensById` must still load from IPFS (do not mark fetched without data). */
      let needIpfs: typeof missing = [];

      if (CDN_BASE && cdnTokensById) {
        for (const it of missing) {
          const token = it.tokenId!;
          const record = cdnTokensById[token];
          if (record) {
            fetchedMetaRef.current.add(token);
            const imageCandidates = (() => {
              const fromMeta = normalizeToGatewayCandidates(record.image || '');
              const thumb = `${THUMBS_BASE}/${token}.webp`;
              return [thumb, ...fromMeta];
            })();
            applyTraitsToCaches(token, Array.isArray(record.attributes) ? record.attributes : []);
            if (cancelled) continue;
            setDriveItems(prev => prev.map(d => d.id === it.id ? { ...d, imageUrl: (imageCandidates[0] || d.imageUrl), imageUrls: imageCandidates } : d));
            setDisplayedItems(prev => prev.map(d => d.id === it.id ? { ...d, imageUrl: (imageCandidates[0] || d.imageUrl), imageUrls: imageCandidates } : d));
          } else {
            needIpfs.push(it);
          }
        }
      } else {
        needIpfs = missing;
      }

      for (const it of needIpfs) {
        const token = it.tokenId!;
        // Mark as in-flight to avoid duplicate requests caused by re-renders
        fetchedMetaRef.current.add(token);
        const url = `${gatewayBase}/${cid}/${token}.json`;
        updates.push(
          (async () => {
            try {
              const res = await fetch(url, { cache: 'force-cache' });
              if (!res.ok) return;
              const meta = await res.json();
              const imageCandidates = normalizeToGatewayCandidates(meta?.image || meta?.image_url || '');
              const attributes = Array.isArray(meta?.attributes) ? meta.attributes : [];
              applyTraitsToCaches(token, attributes);
              if (cancelled) return;
              setDriveItems(prev => {
                const next = prev.map(d => d.id === it.id ? { ...d, imageUrl: (imageCandidates[0] || d.imageUrl), imageUrls: imageCandidates } : d);
                return next;
              });
              // Keep displayed items in sync without resetting pagination
              setDisplayedItems(prev =>
                prev.map(d => d.id === it.id ? { ...d, imageUrl: (imageCandidates[0] || d.imageUrl), imageUrls: imageCandidates } : d)
              );
            } catch {
              // ignore per-item errors
            }
          })()
        );
      }
      await Promise.allSettled(updates);
    })();

    return () => { cancelled = true; };
  }, [displayedItems, applyTraitsToCaches, cdnTokensById]);

  // When trait filters are active, progressively fetch traits for all items (so "all values" can show)
  useEffect(() => {
    const activeTypes = Object.entries(selectedByType).filter(([, s]) => s.size > 0);
    if (activeTypes.length === 0) return;
    const cid = DEFAULT_METADATA_CID;
    if (!cid) return;
    const gatewayBase = IPFS_GATEWAYS[0];
    let cancelled = false;

    // If CDN trait metadata is present, skip IPFS-wide trait fetching
    if (CDN_BASE && cdnTraitsMeta && cdnTraitIndex) {
      return () => { cancelled = true; };
    }

    // Queue across the full collection (0..totalCount-1) to ensure filters cover all tokens
    const queue: string[] = [];
    for (let i = 0; i < totalCount; i++) {
      const token = String(i);
      if (!traitsCacheRef.current[token]) queue.push(token);
    }
    if (queue.length === 0) return;
    const concurrency = 4;
    let idx = 0;
    (async () => {
      const workers = Array.from({ length: concurrency }).map(async () => {
        while (!cancelled) {
          const token = queue[idx++];
          if (!token) break;
          try {
            const res = await fetch(`${gatewayBase}/${cid}/${token}.json`, { cache: 'force-cache' });
            if (!res.ok) continue;
            const meta = await res.json();
            applyTraitsToCaches(token, Array.isArray(meta?.attributes) ? meta.attributes : []);
          } catch {
            // ignore
          }
        }
      });
      await Promise.allSettled(workers);
    })();
    return () => { cancelled = true; };
  }, [driveItems, selectedByType, applyTraitsToCaches, cdnTraitIndex, cdnTraitsMeta, totalCount]);

  // (Removed) Magic Eden prefetch – traits now come from IPFS metadata and a local cache

  // Recompute available values (union) from the traits cache
  useEffect(() => {
    // Start from CDN traits meta if available to ensure full coverage,
    // then merge in any values discovered from metadata fetches.
    const unionMap: Record<string, Set<string>> = {};

    if (cdnTraitsMeta?.types && cdnTraitsMeta?.valuesByType) {
      for (const type of cdnTraitsMeta.types) {
        if (EXCLUDED_TRAIT_TYPES.has(type)) continue;
        unionMap[type] = new Set<string>(cdnTraitsMeta.valuesByType[type] || []);
      }
    }

    for (const tokenId in traitsCacheRef.current) {
      const traits = traitsCacheRef.current[tokenId] || [];
      for (const t of traits) {
        if (EXCLUDED_TRAIT_TYPES.has(t.name)) continue;
        if (!unionMap[t.name]) unionMap[t.name] = new Set<string>();
        if (t.value) unionMap[t.name].add(t.value);
      }
    }

    setAvailableValuesByType(unionMap);

    // Refresh trait types order from the union
    const types = Object.keys(unionMap).sort();
    types.forEach(t => seenTraitTypesRef.current.add(t));
    setTraitTypes(Array.from(new Set(types)).sort());
  }, [traitsVersion, cdnTraitsMeta]);

  // Sanitize selected filters if an excluded type sneaks in
  useEffect(() => {
    setSelectedByType(prev => {
      let changed = false;
      const next: Record<string, Set<string>> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (EXCLUDED_TRAIT_TYPES.has(k)) { changed = true; continue; }
        next[k] = v;
      }
      return changed ? next : prev;
    });
  }, [traitTypes]);
  // Apply filters and sorting for drive items
  useEffect(() => {
    // Bump generation so any in-flight observer callback from a previous filter knows to abort
    filterGenRef.current += 1;

    // Build set of matching tokenIds across the full collection (0..totalCount-1)
    // Then ensure driveItems has entries for those tokens (lightweight stubs).
    const matchIds = new Set<string>();

    const q = (searchTerm || '').trim();
    const hasSearch = q.length > 0;

    const activeTypes = Object.entries(selectedByType).filter(([, s]) => s.size > 0);
    const hasTraitFilters = activeTypes.length > 0;

    // Detect whether actual filter criteria changed (vs. just more data being planned)
    const selKey = Object.entries(selectedByType)
      .filter(([, s]) => s.size > 0)
      .map(([t, s]) => `${t}:${[...s].sort().join(',')}`)
      .sort().join(';');
    const prev = prevFilterCriteriaRef.current;
    const filtersChanged =
      prev.searchTerm !== q ||
      prev.sortBy !== sortBy ||
      prev.selKey !== selKey ||
      prev.cdnIdx !== cdnTraitIndex;
    if (filtersChanged) {
      prevFilterCriteriaRef.current = { searchTerm: q, sortBy, selKey, cdnIdx: cdnTraitIndex };
    }

    // If neither search nor trait filters, fall back to existing items (paged planning)
    if (!hasSearch && !hasTraitFilters) {
      // Sorting
      const sorted = [...driveItems].sort((a, b) => {
        switch (sortBy) {
          case 'token-asc': {
            const ai = a.tokenId ? parseInt(a.tokenId, 10) : Number.MAX_SAFE_INTEGER;
            const bi = b.tokenId ? parseInt(b.tokenId, 10) : Number.MAX_SAFE_INTEGER;
            return ai - bi;
          }
          case 'token-desc': {
            const ai = a.tokenId ? parseInt(a.tokenId, 10) : Number.MIN_SAFE_INTEGER;
            const bi = b.tokenId ? parseInt(b.tokenId, 10) : Number.MIN_SAFE_INTEGER;
            return bi - ai;
          }
          default:
            return 0;
        }
      });
      setFilteredItems(sorted);
      // Only reset to page 1 when the actual filter criteria changed — NOT when more items are planned
      if (filtersChanged) {
        setPage(1);
        setDisplayedItems(sorted.slice(0, itemsPerPage));
      }
      const canPlanMore = (plannedUntil + 1) < totalCount;
      setHasMore(sorted.length > itemsPerPage || canPlanMore);
      return;
    }

    // 1) Compute search matches
    let searchSet: Set<string> | null = null;
    if (hasSearch) {
      searchSet = new Set<string>();
      for (let i = 0; i < totalCount; i++) {
        const token = String(i);
        if (token.includes(q)) searchSet.add(token);
      }
    }

    // 2) Compute trait filter matches
    let traitSet: Set<string> | null = null;
    if (hasTraitFilters) {
      if (CDN_BASE && cdnTraitIndex) {
        let first = true;
        let working: Set<string> = new Set();
        for (const [type, values] of activeTypes) {
          const mapForType = cdnTraitIndex[type] || {};
          const idsForType = new Set<string>();
          values.forEach(v => {
            const arr = mapForType[v] || [];
            for (const id of arr) idsForType.add(String(id));
          });
          if (first) {
            working = idsForType;
            first = false;
          } else {
            working = new Set(Array.from(working).filter(x => idsForType.has(x)));
          }
        }
        traitSet = working;
      } else {
        traitSet = new Set<string>();
        for (let i = 0; i < totalCount; i++) {
          const token = String(i);
          const traits = traitsCacheRef.current[token] || [];
          if (traits.length === 0) continue;
          const ok = activeTypes.every(([type, values]) =>
            traits.some(t => t.name === type && values.has(t.value))
          );
          if (ok) traitSet.add(token);
        }
      }
    }

    // 3) Intersect: when both are active use AND logic so results satisfy ALL conditions
    if (searchSet && traitSet) {
      searchSet.forEach(id => { if (traitSet!.has(id)) matchIds.add(id); });
    } else if (searchSet) {
      searchSet.forEach(id => matchIds.add(id));
    } else if (traitSet) {
      traitSet.forEach(id => matchIds.add(id));
    }

    // Ensure driveItems contains stubs for all matchIds (use ref to prevent duplicates across re-runs)
    if (matchIds.size > 0) {
      const additions: DriveItem[] = [];
      matchIds.forEach(token => {
        if (!plannedIdsRef.current.has(token)) {
          plannedIdsRef.current.add(token);
          additions.push({ id: token, name: token, imageUrl: '', tokenId: token });
        }
      });
      if (additions.length > 0) {
        setDriveItems(prev => {
          // Extra dedup guard: ensure no token ID already present
          const existingIds = new Set(prev.map(d => d.id));
          const safeAdditions = additions.filter(a => !existingIds.has(a.id));
          return safeAdditions.length > 0 ? [...prev, ...safeAdditions] : prev;
        });
      }
    }

    // Filter driveItems by matchIds and deduplicate by tokenId defensively
    const seenIds = new Set<string>();
    const filtered = driveItems.filter(item => {
      if (!item.tokenId || !matchIds.has(item.tokenId)) return false;
      if (seenIds.has(item.tokenId)) return false;
      seenIds.add(item.tokenId);
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'token-asc': {
          const ai = a.tokenId ? parseInt(a.tokenId, 10) : Number.MAX_SAFE_INTEGER;
          const bi = b.tokenId ? parseInt(b.tokenId, 10) : Number.MAX_SAFE_INTEGER;
          return ai - bi;
        }
        case 'token-desc': {
          const ai = a.tokenId ? parseInt(a.tokenId, 10) : Number.MIN_SAFE_INTEGER;
          const bi = b.tokenId ? parseInt(b.tokenId, 10) : Number.MIN_SAFE_INTEGER;
          return bi - ai;
        }
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
    // Only reset to page 1 when actual filter criteria changed
    if (filtersChanged) {
      setPage(1);
      setDisplayedItems(filtered.slice(0, itemsPerPage));
    }
    const canPlanMore = (plannedUntil + 1) < totalCount;
    setHasMore(filtered.length > itemsPerPage || canPlanMore);
  }, [driveItems, searchTerm, sortBy, selectedByType, cdnTraitIndex, plannedUntil, totalCount]);

  // Infinite scroll: append more items when sentinel enters view
  useEffect(() => {
    // Capture current generation — if filters change while this observer is live, bail out
    const capturedGen = filterGenRef.current;

    const observer = new IntersectionObserver(
      entries => {
        // If filters changed since this observer was created, ignore — a fresh observer
        // with the correct filteredItems will be set up after the next render.
        if (filterGenRef.current !== capturedGen) return;
        if (!entries[0].isIntersecting || !hasMore || loading) return;
        const nextPage = page + 1;
        // `page` already represents pages-loaded; next slice starts at page*itemsPerPage
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const newItems = filteredItems.slice(start, end);

        if (newItems.length > 0) {
          setDisplayedItems(prev => {
            const existingIds = new Set(prev.map(d => d.tokenId));
            const fresh = newItems.filter(d => !existingIds.has(d.tokenId));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
          setPage(nextPage);
          // We still may have more if filteredItems has more rows or if more tokens can be planned
          setHasMore(end < filteredItems.length || (plannedUntil + 1) < (totalCount));
        } else {
          // If we've not yet planned all tokens, plan the next chunk and let filters recompute
          if ((plannedUntil + 1) < totalCount) {
            const planStartId = plannedUntil + 1;
            const planEndId = Math.min(plannedUntil + itemsPerPage, (totalCount - 1));
            const planned: DriveItem[] = [];
            for (let id = planStartId; id <= planEndId; id++) {
              plannedIdsRef.current.add(String(id));
              planned.push({
                id: String(id),
                name: String(id),
                imageUrl: '',
                tokenId: String(id),
              });
            }
            setDriveItems(prev => [...prev, ...planned]);
            setPlannedUntil(planEndId);
            // Do not advance page yet; once filteredItems grows, observer will fire again
          } else {
            setHasMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, filteredItems, plannedUntil, totalCount]);

  // Update URL when filters change
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // ── Rarity effects ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setRarityDebouncedSearch(raritySearch), 400);
    return () => clearTimeout(t);
  }, [raritySearch]);

  const fetchRarity = useCallback(async () => {
    if (viewMode !== 'rarity') return;
    setRarityLoading(true);
    try {
      const params = new URLSearchParams({ page: String(rarityPage), limit: String(RARITY_LIMIT) });
      if (rarityActiveTier) params.set('tier', rarityActiveTier);
      const res = await fetch(`/api/rarity?${params}`);
      const data = await res.json();
      setRarityEntries(data.entries || []);
      setRarityTotal(data.total || 0);
      setRarityPages(data.pages || 1);
      if (data.tierCounts) setTierCounts(data.tierCounts);
    } finally {
      setRarityLoading(false);
    }
  }, [viewMode, rarityPage, rarityActiveTier]);

  useEffect(() => { fetchRarity(); }, [fetchRarity]);

  const handleRarityTierChange = (tier: Tier | '') => {
    setRarityActiveTier(tier);
    setRarityPage(1);
  };

  // Client-side search filter within loaded rarity entries
  const displayedRarityEntries = rarityDebouncedSearch
    ? rarityEntries.filter(e =>
        String(e.id).includes(rarityDebouncedSearch) ||
        e.traits.some(t => t.value.toLowerCase().includes(rarityDebouncedSearch.toLowerCase()))
      )
    : rarityEntries;

  const toggleTraitValue = (type: string, value: string) => {
    setSelectedByType(prev => {
      const next = { ...prev };
      const set = new Set(next[type] || []);
      if (set.has(value)) set.delete(value); else set.add(value);
      next[type] = set;
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setIdQuery('');
    setSortBy('token-asc');
    setSelectedByType({});
    setPerTypeSearch({});
  };

  const handleSurpriseMe = () => {
    const randomId = String(Math.floor(Math.random() * 10000));
    setIdQuery(randomId);
    setSearchTerm(randomId);
    setPage(1);
  };

  const clearTypeSelection = (type: string) => {
    setSelectedByType(prev => {
      const next = { ...prev };
      next[type] = new Set<string>();
      return next;
    });
  };

  const openModal = async (item: DriveItem) => {
    setModalItem(item);
  };
  const closeModal = () => setModalItem(null);

  // Flatten selected traits for chip bar
  const selectedChips = useMemo(() => {
    const chips: Array<{ type: string; value: string }> = [];
    for (const [type, set] of Object.entries(selectedByType)) {
      for (const v of set) chips.push({ type, value: v });
    }
    return chips;
  }, [selectedByType]);

  /**
   * Modal was using a stale `modalItem` snapshot: traits live in `traitsCacheRef` and images
   * are filled asynchronously on `driveItems` / `displayedItems`. Merge so traits + image update
   * after lazy metadata loads (traitsVersion bumps when cache updates).
   */
  const modalResolved = useMemo((): DriveItem | null => {
    if (!modalItem) return null;
    const tid = modalItem.tokenId;
    if (!tid) {
      return modalItem;
    }
    const fromList =
      displayedItems.find((d) => d.tokenId === tid) || driveItems.find((d) => d.tokenId === tid);
    const cachedTraits = traitsCacheRef.current[tid];
    const traits =
      cachedTraits && cachedTraits.length > 0
        ? cachedTraits
        : modalItem.traits && modalItem.traits.length > 0
          ? modalItem.traits
          : fromList?.traits;
    return {
      ...modalItem,
      ...(fromList || {}),
      traits,
    };
  }, [modalItem, displayedItems, driveItems, traitsVersion]);

  // Fetch rarity data when a modal is opened
  useEffect(() => {
    if (!modalItem?.tokenId) { setModalRarity(null); return; }
    setModalRarityLoading(true);
    fetch(`/api/rarity?id=${modalItem.tokenId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setModalRarity(d?.entry || null))
      .catch(() => setModalRarity(null))
      .finally(() => setModalRarityLoading(false));
  }, [modalItem?.tokenId]);

  const modalImageSrcs = useMemo(() => {
    if (!modalResolved?.tokenId) return [];
    const t = modalResolved.tokenId;
    const thumb = `${THUMBS_BASE}/${t}.webp`;
    const rest =
      modalResolved.imageUrls && modalResolved.imageUrls.length > 0
        ? modalResolved.imageUrls
        : modalResolved.imageUrl
          ? [modalResolved.imageUrl]
          : [];
    const combined = [thumb, ...rest].filter(Boolean);
    return [...new Set(combined)];
  }, [modalResolved]);

  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <Nav />

      <div className="pt-24 pb-20 relative" suppressHydrationWarning>
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-hero-blue/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-[400px] h-[300px] bg-hero-blue/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" suppressHydrationWarning>
          {/* Hero header */}
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-hero-blue via-hero-blue-light to-accent-cyan">
              Apes on Apechain
            </h1>
            <p className="text-base text-white/50 max-w-2xl mx-auto mb-6">
              10,000 unique collectible Apes on Apechain. Explore, filter by traits, discover rarity.
            </p>

            {/* Collection stats pill row */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {[
                { icon: Layers, label: 'Supply', value: '10,000' },
                { icon: Users, label: 'Owners', value: '1,492' },
                { icon: TrendingUp, label: 'Floor', value: '94.99 APE' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-sm">
                  <Icon className="w-3.5 h-3.5 text-hero-blue" />
                  <span className="text-white/40">{label}</span>
                  <span className="text-white font-bold">{value}</span>
                </div>
              ))}
              {/* Marketplaces inline */}
              <a href={OPENSEA_COLLECTION_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-hero-blue/10 border border-hero-blue/30 hover:bg-hero-blue/20 transition-all text-sm text-hero-blue font-semibold">
                <Image src="/opensea-logo.webp" alt="OpenSea" width={16} height={16} className="w-4 h-4 object-contain" />
                OpenSea
                <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://app.mintify.com/nft/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all text-sm text-white/60 hover:text-white font-medium">
                <Image src="/mintify_icon.jpeg" alt="Mintify" width={16} height={16} className="w-4 h-4 rounded" />
                Mintify
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* View mode tabs */}
            <div className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('browse')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'browse'
                    ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Filter className="w-4 h-4" />
                Browse
              </button>
              <button
                onClick={() => setViewMode('rarity')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'rarity'
                    ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Rarity
              </button>
            </div>
          </motion.div>

          {/* ── RARITY VIEW ──────────────────────────────────────── */}
          {viewMode === 'rarity' && (
            <div>
              {/* Tier Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {TIERS.map((tier, i) => {
                  const cfg = TIER_CONFIG[tier];
                  const Icon = cfg.icon;
                  const count = tierCounts[tier] || 0;
                  return (
                    <motion.button
                      key={tier}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => handleRarityTierChange(rarityActiveTier === tier ? '' : tier)}
                      className={`relative p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                        rarityActiveTier === tier
                          ? `${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow}`
                          : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{tier}</span>
                      </div>
                      <div className="text-2xl font-black text-white">{count.toLocaleString()}</div>
                      <div className="text-xs text-white/40">
                        {rarityTotal ? ((count / rarityTotal) * 100).toFixed(1) : '—'}%
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Search + clear */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    value={raritySearch}
                    onChange={e => setRaritySearch(e.target.value)}
                    placeholder="Search by Ape ID or trait…"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all text-sm"
                  />
                </div>
                {rarityActiveTier && (
                  <button
                    onClick={() => handleRarityTierChange('')}
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/12 text-white/60 hover:text-white hover:border-white/25 transition-all text-sm font-semibold"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {/* Rarity count */}
              {!rarityLoading && (
                <p className="text-sm text-white/40 mb-4">
                  {rarityTotal.toLocaleString()} Apes
                  {rarityActiveTier && <span className="text-hero-blue ml-1">· {rarityActiveTier}</span>}
                </p>
              )}

              {/* Rarity Grid */}
              {rarityLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: RARITY_LIMIT }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : displayedRarityEntries.length === 0 ? (
                <div className="text-center py-24 text-white/40">No Apes found.</div>
              ) : (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <AnimatePresence>
                    {displayedRarityEntries.map((entry, i) => {
                      const cfg = TIER_CONFIG[entry.tier];
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: i * 0.02, duration: 0.25 }}
                        >
                          <Link href={`/collection/${entry.id}`}>
                            <div className={`relative group rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                              entry.tier !== 'Common' ? `${cfg.border} ${cfg.bg}` : 'border-white/10 bg-white/[0.03]'
                            }`}>
                              <div className="aspect-square relative overflow-hidden">
                                <Image
                                  src={`${CDN_THUMB_RARITY}/${entry.id}.webp`}
                                  alt={`Ape #${entry.id}`}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 16vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  unoptimized
                                />
                                {/* Tier badge */}
                                <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  <Icon className="w-2.5 h-2.5" />
                                  {entry.tier}
                                </div>
                                {/* Rank badge */}
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                                  #{entry.rank}
                                </div>
                              </div>
                              <div className="p-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-white">#{entry.id}</span>
                                  <span className="text-[10px] text-white/35 tabular-nums">{entry.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="text-[10px] text-white/35 mt-0.5">{entry.traits.length} traits</div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Pagination */}
              {!rarityDebouncedSearch && rarityPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    onClick={() => setRarityPage(p => Math.max(1, p - 1))}
                    disabled={rarityPage === 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/12 hover:border-hero-blue/40 hover:bg-hero-blue/10 transition-all disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-sm text-white/50">Page {rarityPage} of {rarityPages}</span>
                  <button
                    onClick={() => setRarityPage(p => Math.min(rarityPages, p + 1))}
                    disabled={rarityPage === rarityPages}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/12 hover:border-hero-blue/40 hover:bg-hero-blue/10 transition-all disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── BROWSE VIEW ──────────────────────────────────────── */}
          {viewMode === 'browse' && (<>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-sm text-ape-gray uppercase tracking-widest">Explore the Collection</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Search bar - full width above the grid */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Gradient border wrapper */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-hero-blue/50 via-hero-blue-light/40 to-hero-blue/50 shadow-[0_0_30px_-10px_rgba(0,84,249,0.3)]">
              <div className="glass-dark rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl shadow-black/30 overflow-hidden relative">
                {/* Gradient accent overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-hero-blue/[0.07] via-transparent to-hero-blue-light/[0.07] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="flex flex-col gap-4 relative">
                  {/* Row 1: Search + actions + result count */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative flex-1 min-w-0 group/input">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ape-gray group-focus-within/input:text-hero-blue transition-colors pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Jump to token ID (0–9999)"
                        value={idQuery}
                        onChange={(e) => setIdQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const q = (idQuery || '').trim();
                            setSearchTerm(q);
                            setPage(1);
                          }
                        }}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm placeholder-ape-gray focus:border-hero-blue focus:outline-none focus:ring-2 focus:ring-hero-blue/25 focus:bg-white/[0.07] transition-all duration-200"
                        style={{ color: 'var(--foreground)' }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                      <button
                        className="btn-primary px-5 py-3 text-sm rounded-xl font-medium shadow-lg shadow-hero-blue/20 hover:shadow-hero-blue/30 transition-shadow"
                        onClick={() => {
                          const q = (idQuery || '').trim();
                          setSearchTerm(q);
                          setPage(1);
                        }}
                      >
                        Go
                      </button>
                      <button
                        onClick={handleSurpriseMe}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-hero-blue/40 bg-hero-blue/10 text-hero-blue hover:bg-hero-blue/20 hover:border-hero-blue/60 transition-all text-sm font-medium"
                      >
                        <Sparkles className="w-4 h-4" />
                        Surprise
                      </button>
                      {/* Sort toggle */}
                      <button
                        onClick={() => setSortBy(s => s === 'token-asc' ? 'token-desc' : 'token-asc')}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-sm text-white/60 hover:text-white"
                        title={sortBy === 'token-asc' ? 'ID: Low → High' : 'ID: High → Low'}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        {sortBy === 'token-asc' ? '0→9' : '9→0'}
                      </button>
                      <button
                        className="px-4 py-3 rounded-xl border border-white/10 text-sm hover:border-hero-blue/50 hover:bg-white/5 transition-all"
                        style={{ color: 'var(--foreground)' }}
                        onClick={clearFilters}
                      >
                        Clear
                      </button>
                      {!loading && (
                        <div className="hidden lg:flex items-center px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-ape-gray">
                          {filteredItems.length === 0
                            ? 'No results'
                            : `${filteredItems.length.toLocaleString()} Ape${filteredItems.length !== 1 ? 's' : ''}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Active filter chips */}
                  <AnimatePresence mode="popLayout">
                    {selectedChips.length > 0 && (
                      <motion.div
                        key="filter-chips"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 overflow-hidden"
                      >
                        <span className="text-xs text-ape-gray font-medium w-full sm:w-auto">Active filters:</span>
                        {selectedChips.map((c, idx) => (
                          <motion.button
                            key={`${c.type}-${c.value}-${idx}`}
                            onClick={() => toggleTraitValue(c.type, c.value)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-hero-blue/15 border border-hero-blue/40 hover:border-hero-blue/60 hover:bg-hero-blue/25 transition-all group"
                            title="Remove filter"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span>{c.type}: {c.value}</span>
                            <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                          </motion.button>
                        ))}
                        <button
                          className="text-xs text-hero-blue hover:underline font-medium"
                          onClick={clearFilters}
                        >
                          Clear all
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Scroll to filters on mobile */}
            <button
              onClick={() => filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-3 flex items-center gap-2 text-sm text-ape-gray hover:text-hero-blue transition-colors lg:hidden"
            >
              <Filter className="w-4 h-4" />
              Filter by traits
            </button>
          </motion.div>

          {/* Sidebar filters (left) + Grid (right) */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Trait Filters */}
            <aside ref={filtersRef} className="lg:col-span-1">
              <div className="sticky top-24 space-y-3">

                {/* Panel header */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-hero-blue" />
                    <span className="text-sm font-bold text-white">Filter Traits</span>
                    {selectedChips.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-hero-blue text-white font-bold">
                        {selectedChips.length}
                      </span>
                    )}
                  </div>
                  {selectedChips.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-[11px] text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                {/* Active chips */}
                {selectedChips.length > 0 && (
                  <div className="rounded-xl border border-hero-blue/25 bg-hero-blue/5 p-2.5 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-hero-blue/50 font-bold">Active</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedChips.map((c, idx) => (
                        <button
                          key={`${c.type}-${c.value}-${idx}`}
                          onClick={() => toggleTraitValue(c.type, c.value)}
                          className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-lg bg-hero-blue/15 border border-hero-blue/30 text-hero-blue text-[11px] font-medium hover:bg-hero-blue/25 transition-colors group"
                        >
                          {c.value}
                          <X className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                  <input
                    type="text"
                    value={typeFilterTerm}
                    onChange={e => setTypeFilterTerm(e.target.value)}
                    placeholder="Search traits…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/8 bg-white/[0.03] text-sm text-white placeholder-white/20 focus:border-hero-blue/40 focus:bg-white/5 focus:outline-none transition-all"
                  />
                </div>

                {/* Accordion list */}
                {!cdnTraitsMeta ? (
                  /* Loading skeleton */
                  <div className="space-y-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl bg-white/[0.03] border border-white/8 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5 custom-scrollbar">
                    {traitTypes
                      .filter(t => !EXCLUDED_TRAIT_TYPES.has(t))
                      .filter(t => t.toLowerCase().includes(typeFilterTerm.toLowerCase()))
                      .map(type => {
                        const allValues = Array.from(availableValuesByType[type] || []).sort((a, b) => a.localeCompare(b));
                        const selectedSet = selectedByType[type] || new Set<string>();
                        const selectedCount = selectedSet.size;
                        const isExpanded = !!expandedTypes[type];
                        const search = perTypeSearch[type] || '';
                        const filteredValues = search
                          ? allValues.filter(v => v.toLowerCase().includes(search.toLowerCase()))
                          : allValues;
                        const counts = cdnTraitsMeta?.counts?.[type] || {};
                        const maxCount = Math.max(...Object.values(counts));

                        return (
                          <div
                            key={type}
                            className={`rounded-xl border overflow-hidden transition-colors duration-150 ${
                              selectedCount > 0
                                ? 'border-hero-blue/35 bg-hero-blue/[0.04]'
                                : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                            }`}
                          >
                            {/* Header */}
                            <button
                              onClick={() => setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }))}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-left group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs font-semibold truncate transition-colors ${selectedCount > 0 ? 'text-hero-blue' : 'text-white/70 group-hover:text-white'}`}>
                                  {type}
                                </span>
                                {selectedCount > 0 && (
                                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-hero-blue text-white text-[9px] font-black flex items-center justify-center">
                                    {selectedCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                                <span className="text-[10px] text-white/15">{allValues.length}</span>
                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                  <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                                </div>
                              </div>
                            </button>

                            {/* Body — CSS grid transition (no Framer Motion = no twitching) */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateRows: isExpanded ? '1fr' : '0fr',
                                transition: 'grid-template-rows 0.2s ease',
                              }}
                            >
                              <div className="overflow-hidden">
                                <div className="border-t border-white/8">
                                  {/* Clear + value search */}
                                  <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                                    {allValues.length > 6 && (
                                      <div className="relative flex-1">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15" />
                                        <input
                                          value={search}
                                          onChange={e => setPerTypeSearch(prev => ({ ...prev, [type]: e.target.value }))}
                                          placeholder="Search…"
                                          className="w-full pl-6 pr-2 py-1 bg-white/5 border border-white/8 rounded-lg text-[11px] text-white placeholder-white/15 focus:outline-none focus:border-hero-blue/30"
                                        />
                                      </div>
                                    )}
                                    {selectedCount > 0 && (
                                      <button
                                        onClick={() => clearTypeSelection(type)}
                                        className="flex-shrink-0 text-[10px] text-hero-blue/70 hover:text-hero-blue transition-colors"
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>

                                  {/* Values */}
                                  <div className="px-1.5 pb-2 max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                    {filteredValues.length === 0 ? (
                                      <div className="text-[11px] text-white/20 py-2 text-center">No results</div>
                                    ) : (
                                      filteredValues.map(value => {
                                        const count = counts[value] ?? 0;
                                        const pct = count > 0 ? ((count / 10000) * 100) : 0;
                                        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                        const isChecked = selectedSet.has(value);
                                        return (
                                          <label
                                            key={value}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group/val ${
                                              isChecked ? 'bg-hero-blue/15' : 'hover:bg-white/5'
                                            }`}
                                          >
                                            {/* Checkbox */}
                                            <div className={`flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                              isChecked
                                                ? 'bg-hero-blue border-hero-blue'
                                                : 'border-white/20 group-hover/val:border-white/40'
                                            }`}>
                                              {isChecked && (
                                                <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
                                                  <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              )}
                                            </div>
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleTraitValue(type, value)}
                                              className="sr-only"
                                            />

                                            {/* Label + bar */}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between mb-0.5">
                                                <span className={`text-[11px] font-medium truncate ${isChecked ? 'text-hero-blue' : 'text-white/60 group-hover/val:text-white/80'}`}>
                                                  {value}
                                                </span>
                                                <span className={`text-[10px] flex-shrink-0 ml-1 ${isChecked ? 'text-hero-blue/70' : 'text-white/20'}`}>
                                                  {pct > 0 ? `${pct.toFixed(1)}%` : ''}
                                                </span>
                                              </div>
                                              {/* Rarity bar */}
                                              <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                  className={`h-full rounded-full transition-all duration-300 ${isChecked ? 'bg-hero-blue' : 'bg-white/20'}`}
                                                  style={{ width: `${barWidth}%` }}
                                                />
                                              </div>
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </aside>

            {/* Right: Grid */}
            <section className="lg:col-span-4">
              {/* Results header */}
              {!loading && (
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-ape-gray">
                      {filteredItems.length === 0
                        ? 'No results'
                        : `Showing ${displayedItems.length}${hasMore ? '+' : ''} of ${filteredItems.length.toLocaleString()} Apes`}
                      {(searchTerm || selectedChips.length > 0) && ' (filtered)'}
                    </p>
                    {(searchTerm || selectedChips.length > 0) && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-hero-blue hover:underline font-medium"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                  {selectedChips.length > 0 && (
                    <p className="text-xs text-ape-gray">
                      Filtered by{' '}
                      {selectedChips
                        .map((chip) => `${chip.type}: ${chip.value}`)
                        .join(' • ')}
                    </p>
                  )}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 py-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="glass-dark rounded-xl border border-white/5 animate-pulse overflow-hidden"
                    >
                      <div className="aspect-square bg-white/5" />
                      <div className="p-3 space-y-2 bg-white/[0.02] border-t border-white/5">
                        <div className="h-3 w-2/3 rounded-full bg-white/10" />
                        <div className="h-3 w-1/3 rounded-full bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <>
                  {/* 4 columns on desktop */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {displayedItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        className="glass-dark rounded-2xl overflow-hidden border border-white/10 cursor-pointer group hover:border-hero-blue/40 transition-all duration-300 hover:shadow-lg hover:shadow-hero-blue/10"
                        onClick={() => openModal(item)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
                        whileHover={{ scale: 1.02, y: -3 }}
                      >
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden">
                          {item.tokenId ? (
                            <FallbackImage
                              srcs={[
                                `${THUMBS_BASE}/${item.tokenId}.webp`,
                                ...(item.imageUrls && item.imageUrls.length > 0
                                  ? item.imageUrls
                                  : (item.imageUrl ? [item.imageUrl] : [])),
                              ]}
                              alt={item.name}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover group-hover:scale-108 transition-transform duration-500"
                            />
                          ) : item.imageUrl ? (
                            <FallbackImage
                              srcs={[item.imageUrl]}
                              alt={item.name}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
                              <div className="w-8 h-8 border-2 border-hero-blue/30 border-t-hero-blue rounded-full animate-spin" />
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                            <span className="text-xs font-semibold text-white/80 bg-hero-blue/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                              Quick view
                            </span>
                          </div>
                        </div>
                        {/* Bottom info strip */}
                        <div className="px-3 py-2.5 flex items-center justify-between border-t border-white/[0.06]">
                          <span className="text-sm font-bold text-white">
                            {item.tokenId ? `#${item.tokenId}` : item.name}
                          </span>
                          <Link
                            href={item.tokenId ? `/collection/${item.tokenId}` : '#'}
                            onClick={e => e.stopPropagation()}
                            className="text-[11px] text-white/30 hover:text-hero-blue transition-colors flex items-center gap-0.5 font-medium"
                          >
                            Detail <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </motion.div>
                  ))}
                </div>

                {hasMore && (
                  <div ref={observerTarget} className="flex justify-center py-8">
                    <div className="w-12 h-12 border-4 border-hero-blue/30 border-t-hero-blue rounded-full animate-spin"></div>
                  </div>
                )}

                  {!hasMore && filteredItems.length > 0 && (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p style={{ color: 'var(--ape-gray)' }}>You&apos;ve reached the end of the collection</p>
                  </motion.div>
                )}

                  {filteredItems.length === 0 && (
                  <motion.div
                    className="text-center py-16 px-6 rounded-2xl glass-dark border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      No Apes match your filters
                    </p>
                    <p className="text-sm mb-6 text-ape-gray">
                      Try broadening your search or clearing some traits
                    </p>
                    <button onClick={clearFilters} className="btn-primary px-6 py-2">
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </>
          )}

              {/* Infinite scroll sentinel is shown above when hasMore */}
            </section>
          </div>

          </>)}
        </div>
      </div>

      <Footer />
      <ScrollToTopButton />
      {/* Modal Preview */}
      <AnimatePresence>
      {modalResolved && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
          <motion.div
            className="relative z-10 w-full sm:w-[95vw] sm:max-w-3xl mx-auto rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/15"
            style={{ background: 'linear-gradient(135deg, rgba(10,12,20,0.97) 0%, rgba(5,10,25,0.97) 100%)' }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                {modalRarity && (() => {
                  const cfg = TIER_CONFIG[modalRarity.tier];
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {modalRarity.tier}
                    </span>
                  );
                })()}
                <h2 className="text-base font-bold text-white">
                  Ape {modalResolved.tokenId ? `#${modalResolved.tokenId}` : '—'}
                </h2>
                {modalRarity && (
                  <span className="text-xs text-white/40">Rank #{modalRarity.rank.toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined' || !modalResolved.tokenId) return;
                    void navigator.clipboard?.writeText(`${window.location.origin}/collection/${modalResolved.tokenId}`);
                  }}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  title="Copy link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                {modalResolved.tokenId && (
                  <Link
                    href={`/collection/${modalResolved.tokenId}`}
                    onClick={closeModal}
                    className="p-2 rounded-lg text-white/40 hover:text-hero-blue hover:bg-hero-blue/10 transition-all"
                    title="Full details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] max-h-[85vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
              {/* Left: image */}
              <div className="relative w-full aspect-square bg-black/30 flex-shrink-0">
                {modalImageSrcs.length > 0 ? (
                  <FallbackImage
                    srcs={modalImageSrcs}
                    alt={modalResolved.name}
                    sizes="(max-width: 640px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-hero-blue/30 border-t-hero-blue rounded-full animate-spin" />
                  </div>
                )}
                {/* Rarity score overlay on image */}
                {modalRarity && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-xs text-white/70 font-mono">
                    Score: {modalRarity.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>

              {/* Right: info */}
              <div className="flex flex-col sm:max-h-[600px] overflow-hidden">
                {/* Rarity mini stats */}
                {(modalRarity || modalRarityLoading) && (
                  <div className="flex gap-2 px-4 pt-3 pb-2">
                    {modalRarityLoading ? (
                      <>
                        <div className="flex-1 h-14 rounded-xl bg-white/5 animate-pulse" />
                        <div className="flex-1 h-14 rounded-xl bg-white/5 animate-pulse" />
                        <div className="flex-1 h-14 rounded-xl bg-white/5 animate-pulse" />
                      </>
                    ) : modalRarity && (
                      <>
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/8 px-3 py-2 text-center">
                          <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Rank</div>
                          <div className="text-base font-black text-white">#{modalRarity.rank}</div>
                        </div>
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/8 px-3 py-2 text-center">
                          <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Score</div>
                          <div className="text-base font-black text-white">{(modalRarity.score / 1000).toFixed(1)}k</div>
                        </div>
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/8 px-3 py-2 text-center">
                          <div className="text-xs text-white/35 uppercase tracking-wider mb-0.5">Traits</div>
                          <div className="text-base font-black text-white">{modalRarity.traits.length}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Traits */}
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Traits</div>
                  {!modalResolved.traits || modalResolved.traits.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-white/30 py-4">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                      {modalResolved.tokenId ? 'Loading traits…' : 'No traits available'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {modalResolved.traits.map((t, idx) => {
                        const countData = cdnTraitsMeta?.counts?.[t.name]?.[t.value];
                        const pct = countData ? ((countData / 10000) * 100).toFixed(1) : null;
                        const isRare = pct ? parseFloat(pct) < 10 : false;
                        return (
                          <div
                            key={`${t.name}-${t.value}-${idx}`}
                            className={`px-2.5 py-2 rounded-xl border text-xs transition-colors ${
                              isRare
                                ? 'bg-hero-blue/5 border-hero-blue/25'
                                : 'bg-white/[0.03] border-white/8'
                            }`}
                          >
                            <div className="text-white/35 uppercase tracking-wider text-[10px] mb-0.5">{t.name}</div>
                            <div className="text-white font-semibold truncate">{t.value}</div>
                            {pct && (
                              <div className={`text-[10px] mt-0.5 ${isRare ? 'text-hero-blue/70' : 'text-white/20'}`}>
                                {pct}% have this
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Buy buttons */}
                <div className="px-4 pb-4 pt-2 border-t border-white/8 flex gap-2 flex-wrap">
                  {modalResolved.tokenId && (
                    <a
                      href={`https://opensea.io/assets/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0/${modalResolved.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white text-sm font-bold transition-all shadow-lg shadow-hero-blue/25"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy on OpenSea
                    </a>
                  )}
                  {modalResolved.tokenId && (
                    <Link
                      href={`/collection/${modalResolved.tokenId}`}
                      onClick={closeModal}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-white/15 hover:border-hero-blue/40 text-white/60 hover:text-white text-sm font-medium transition-all"
                    >
                      Full Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
