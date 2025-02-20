import * as jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export const generateAccessToken = (
  payload: JWTPayload,
  secret: string,
  expiresIn: string | number,
): { accessToken: string } => {
  const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  return {
    accessToken: token,
  };
};

export const verifyAccessToken = (
  token: string,
  secret: string,
): JWTPayload => {
  const decoded = jwt.verify(token, secret);
  return decoded as JWTPayload;
};
