import { supabaseAdmin } from '@/lib/supabase/admin';

export async function submitFeedback(value: unknown, comment?: unknown, context?: unknown): Promise<void> {
  if (value !== 'up' && value !== 'down') return;
  await supabaseAdmin()
    .from('feedback')
    .insert({
      value,
      comment: typeof comment === 'string' && comment.trim() ? comment.trim().slice(0, 500) : null,
      context: typeof context === 'string' ? context.slice(0, 40) : null,
    });
}
