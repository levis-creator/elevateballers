import { p as prisma } from './prisma_sB1uhqJV.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email }
  });
}
async function findUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
}
function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
async function getCurrentUser(request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...values] = c.split("=");
      return [key, values.join("=")];
    })
  );
  const token = cookies["auth-token"];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return await findUserById(payload.userId);
}
async function requireAuth(request) {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
async function requireAdmin(request) {
  const user = await requireAuth(request);
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export { requireAuth as a, createToken as c, findUserByEmail as f, getCurrentUser as g, requireAdmin as r, verifyPassword as v };
