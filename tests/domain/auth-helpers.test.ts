import { describe, expect, it } from 'vitest';
import * as server from '@/lib/supabase/server';

describe('supabase server helper', () => {
  it('exports createServerSupabase', () => {
    expect(typeof server.createServerSupabase).toBe('function');
  });
});
