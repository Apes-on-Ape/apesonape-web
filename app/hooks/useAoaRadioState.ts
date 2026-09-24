'use client';

import { useEffect, useState } from 'react';
import { AOA_RADIO_STATE_EVENT, type AoaRadioStateDetail } from '@/lib/aoa-radio';

const EMPTY: AoaRadioStateDetail = {
  title: '',
  playing: false,
  ready: false,
  source: 'soundcloud',
};

export function useAoaRadioState() {
  const [state, setState] = useState<AoaRadioStateDetail>(EMPTY);

  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<AoaRadioStateDetail>).detail;
      if (!detail) return;
      setState(detail);
    };
    window.addEventListener(AOA_RADIO_STATE_EVENT, onState);
    return () => window.removeEventListener(AOA_RADIO_STATE_EVENT, onState);
  }, []);

  return state;
}
