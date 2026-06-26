import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  requestHeaders: {},
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    // Decode JWT token của Supabase để lấy userId thật (sub)
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.sub) {
      (req as any).userId = decoded.sub;
      return next();
    }
    return res.status(401).json({ error: "Invalid token" });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}