import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? title + ' | CareBed' : 'CareBed | Hospital bed availability and patient specialization';
  }, [title]);
}
