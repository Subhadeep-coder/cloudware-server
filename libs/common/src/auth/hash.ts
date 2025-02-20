import * as argon2 from 'argon2';

export const hash = async (payload: string, salt?: string): Promise<string> => {
  const saltBuffer = salt ? Buffer.from(salt) : undefined;
  const hash = await argon2.hash(payload, { salt: saltBuffer });
  return hash;
};

export const verify = async (
  hashedPassword: string,
  password: string,
): Promise<boolean> => {
  const verify = await argon2.verify(hashedPassword, password);
  return verify;
};
