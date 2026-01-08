import jwt from "jsonwebtoken";

export type AdminJwtPayload = {
  sub: string;
  isAdmin: true;
};

export type UserJwtPayload = {
  sub: string;
  isAdmin?: false;
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable");
}

const JWT_SECRET_STRING: string = JWT_SECRET;

export function signAdminToken(): string {
  const payload: AdminJwtPayload = { sub: "admin", isAdmin: true };
  return jwt.sign(payload, JWT_SECRET_STRING, { expiresIn: "7d" });
}

export function signUserToken(userId: string): string {
  const payload: UserJwtPayload = { sub: userId, isAdmin: false };
  return jwt.sign(payload, JWT_SECRET_STRING, { expiresIn: "30d" });
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireAdmin(req: Request): AdminJwtPayload {
  const token = getBearerToken(req);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedUnknown: unknown = jwt.verify(token, JWT_SECRET_STRING);
  if (
    !decodedUnknown ||
    typeof decodedUnknown !== "object" ||
    !("isAdmin" in decodedUnknown) ||
    (decodedUnknown as { isAdmin?: unknown }).isAdmin !== true
  ) {
    throw new Error("Forbidden");
  }

  const decoded = decodedUnknown as AdminJwtPayload;
  return decoded;
}

export function requireUser(req: Request): UserJwtPayload {
  const token = getBearerToken(req);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedUnknown: unknown = jwt.verify(token, JWT_SECRET_STRING);
  if (!decodedUnknown || typeof decodedUnknown !== "object" || !("sub" in decodedUnknown)) {
    throw new Error("Forbidden");
  }

  const decoded = decodedUnknown as UserJwtPayload;
  if (!decoded.sub) {
    throw new Error("Forbidden");
  }
  return decoded;
}

export function isValidAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return username === adminUsername && password === adminPassword;
}
