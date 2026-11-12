export function clinicBookingError(error, fallback) {
  const message = String(error?.message || '');
  if (error?.code === '42703' || /column .* does not exist/i.test(message)) {
    return 'Clinic booking setup is incomplete. Please ask the administrator to run supabase/existing_project_migration.sql in Supabase SQL Editor, then reload the page.';
  }
  if (error?.code === '42P01' || /relation .* does not exist/i.test(message)) {
    return 'Clinic booking is not configured yet. Please contact the barangay administrator.';
  }
  if (error?.code === '23P01' || error?.code === '23505') {
    return 'That appointment time was just taken. Please choose another available time.';
  }
  return fallback;
}
