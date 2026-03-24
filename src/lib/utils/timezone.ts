// Utility functions for timezone handling

/**
 * Get the user's current timezone
 * @returns The timezone string (e.g., "America/New_York", "Europe/London")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to a default timezone if detection fails
    return 'UTC';
  }
}

/**
 * Get a user-friendly timezone display name
 * @param timezone - The timezone string
 * @returns A formatted timezone name (e.g., "EST (UTC-5)", "GMT+1")
 */
export function getTimezoneDisplayName(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    if (timeZonePart) {
      return timeZonePart.value;
    }
    
    // Fallback: try to get offset
    const offset = now.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return timezone;
  }
}

/**
 * Format a time with timezone information
 * @param time - Time string in HH:MM format
 * @param date - Date string
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Formatted time with timezone
 */
export function formatTimeWithTimezone(
  time: string, 
  date: string, 
  timezone?: string
): string {
  const userTz = timezone || getUserTimezone();
  const tzDisplay = getTimezoneDisplayName(userTz);
  
  // Format the time (assuming time is in HH:MM format)
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const formattedTime = `${displayHour}:${minutes} ${ampm}`;
  
  return `${formattedTime} (${tzDisplay})`;
}

/**
 * Format date and time range with timezone information
 * @param date - Date string
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Formatted date and time range with timezone
 */
export function formatDateTimeRangeWithTimezone(
  date: string,
  startTime: string,
  endTime: string,
  timezone?: string
): string {
  const meetingDate = new Date(date);
  const formattedDate = meetingDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  const userTz = timezone || getUserTimezone();
  const tzDisplay = getTimezoneDisplayName(userTz);
  
  // Format times
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return `${formattedDate} • ${formatTime(startTime)} - ${formatTime(endTime)} (${tzDisplay})`;
} 