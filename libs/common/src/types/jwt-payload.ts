export type JWTPayload = {
  sub?: string;
  name: string;
  email: string;
};

export type VerifyUserPayload = {
  name: string;
  email: string;
  password: string;
  activationCode: string;
};
