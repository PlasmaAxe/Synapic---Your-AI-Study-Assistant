import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  'https://tzlbrnewxphilhkbsgjh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGJybmV3eHBoaWxoa2JzZ2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjczODEsImV4cCI6MjA5MjYwMzM4MX0.Hr0l-fxnTAHcGB__NwmAXT7451-mT_My6PXlU65tVsI'
); //^supabase anon key
