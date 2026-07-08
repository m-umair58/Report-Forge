import { describe, expect, it } from 'vitest';

import { Charts } from './index.js';

describe('Charts factory', () => {
  it('creates bar chart descriptors', () => {
    const descriptor = Charts.Bar({
      title: 'Monthly Revenue',
      data: [{ month: 'Jan', amount: 1200 }],
      x: 'month',
      y: 'amount',
    });

    expect(descriptor.type).toBe('chart');
    expect(descriptor.props['type']).toBe('bar');
    expect(descriptor.props['title']).toBe('Monthly Revenue');
  });

  it('creates line chart descriptors', () => {
    const descriptor = Charts.Line({
      data: [{ month: 'Jan', amount: 10 }],
      x: 'month',
      y: 'amount',
    });
    expect(descriptor.props['type']).toBe('line');
  });
});
