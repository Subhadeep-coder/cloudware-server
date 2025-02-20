import { VerifyUserPayload } from '../types';
import jwt from 'jsonwebtoken';

export const generateVerificationToken = (
  payload: VerifyUserPayload,
  secret: string,
  expiresIn: string | number,
): { activationToken: string } => {
  const token = jwt.sign(payload, secret, {
    expiresIn: '1d',
  } as jwt.SignOptions);
  return {
    activationToken: token,
  };
};

export const verifyVerificationToken = (
  token: string,
  secret: string,
): VerifyUserPayload => {
  const decoded = jwt.verify(token, secret);
  return decoded as VerifyUserPayload;
};
