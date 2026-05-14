'use client'

import { useEffect, useState } from 'react';

export default function FormattedDate({ date }: { date: Date | string }) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    setFormatted(new Date(date).toLocaleString());
  }, [date]);

  return <span style={{ opacity: formatted ? 1 : 0 }}>{formatted || '...'}</span>;
}
