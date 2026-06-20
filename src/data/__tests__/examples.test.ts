import { describe, expect, it } from 'vitest';
import type { Flow } from '../../types';
import { allSteps } from '../../lib/flow';
import { exampleDiffAfter, exampleDiffBefore, exampleFlow } from '../examples';

function collectIds(flow = exampleFlow): string[] {
  return flow.items.flatMap((item) =>
    item.isGroup ? [item.id, ...item.steps.map((step) => step.id)] : [item.id]
  );
}

function stepTitles(flow: Flow): Set<string> {
  return new Set(allSteps(flow.items).map((step) => step.title.toLowerCase()));
}

function collectRefs(flow: Flow): string[] {
  return allSteps(flow.items).flatMap((step) =>
    step.references
      .split(',')
      .map((ref) => ref.trim().replace(/^@/, '').toLowerCase())
      .filter(Boolean)
  );
}

describe('example data', () => {
  it('uses unique ids across flow items and group steps', () => {
    const ids = collectIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Every example flow — including the diff pair, whose steps spread-inherit
  // `references` from exampleFlow — must keep references resolvable so a future
  // title rename can't silently produce a dangling @reference / broken edge.
  it.each([
    ['exampleFlow', exampleFlow],
    ['exampleDiffBefore', exampleDiffBefore],
    ['exampleDiffAfter', exampleDiffAfter],
  ])('uses references that resolve to existing step titles (%s)', (_name, flow) => {
    const titles = stepTitles(flow);
    const refs = collectRefs(flow);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(titles.has(ref)).toBe(true);
    }
  });

  it('provides a meaningful before and after diff pair', () => {
    expect(exampleDiffBefore.title).not.toBe(exampleDiffAfter.title);
    expect(exampleDiffBefore.items.length).toBeLessThan(exampleDiffAfter.items.length);
  });
});
