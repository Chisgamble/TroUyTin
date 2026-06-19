import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  requestHeaders: {},
});

function getKey(header: any, callback: any) {
  console.log("HEADER:", header);
  client.getSigningKey(header.kid, (err, key) => {
    console.log("JWKS ERR:", err);
    console.log("KEY:", key);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, getKey, {}, (err, decoded: any) => {
    console.log("VERIFY ERROR:", err);
    console.log("DECODED:", decoded);
    if (err) return res.status(401).json({ error: "Invalid token" });

    req.userId = decoded.sub; // contains user id, email, etc.
    next();
  });
}