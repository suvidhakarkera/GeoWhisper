/**
 * Moderator configuration
 * List of usernames or emails that have moderator privileges
 */

export const MODERATOR_LIST = [
    'sushan_shetty',
  'ashton_mathias',
  'suvidha_karkera',
  'nikki',
  'sankirthan_rao',
  'nishitha_shetty'
  // Add more moderator usernames here
];

/**
 * Check if a user is a moderator
 * @param username - The username to check
 * @param email - Optional email to check
 * @returns true if user is a moderator
 */
export function isModerator(username: string, email?: string): boolean {
  const normalizedUsername = username?.toLowerCase().trim();
  const normalizedEmail = email?.toLowerCase().trim();
  
  return MODERATOR_LIST.some(mod => {
    const normalizedMod = mod.toLowerCase().trim();
    return normalizedUsername === normalizedMod || normalizedEmail === normalizedMod;
  });
}

export default { MODERATOR_LIST, isModerator };
