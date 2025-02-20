import * as crypto from 'crypto';

export function generateInvitationCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}
