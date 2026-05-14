import { useEffect, useRef, useState } from 'react';

const pickActiveId = (sectionIds, ratios, threshold) => {
  let bestId = null;
  let bestRatio = -Infinity;
  for (const id of sectionIds) {
    const ratio = ratios.get(id);
    if (typeof ratio === 'number' && ratio >= threshold && ratio > bestRatio) {
      bestId = id;
      bestRatio = ratio;
    }
  }
  return bestId;
};

const resolveNode = (id) =>
  document.getElementById(id) ?? document.querySelector(`[name="${id}"]`);

export const useActiveSection = (sectionIds, { enabled = true, threshold = 0.5 } = {}) => {
  const [activeId, setActiveId] = useState(null);
  const ratiosRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) {
      ratiosRef.current.clear();
      setActiveId(null);
      return undefined;
    }

    const ratios = ratiosRef.current;
    ratios.clear();

    if (typeof IntersectionObserver === 'undefined') {
      setActiveId(null);
      return undefined;
    }

    const nodes = sectionIds
      .map((id) => ({ id, node: resolveNode(id) }))
      .filter((entry) => entry.node);

    if (nodes.length === 0) {
      setActiveId(null);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id || entry.target.getAttribute('name');
          if (id) ratios.set(id, entry.intersectionRatio);
        });
        const next = pickActiveId(sectionIds, ratios, threshold);
        setActiveId((prev) => (prev === next ? prev : next));
      },
      { threshold },
    );

    nodes.forEach(({ node }) => observer.observe(node));

    return () => observer.disconnect();
  }, [enabled, threshold, sectionIds]);

  return activeId;
};
