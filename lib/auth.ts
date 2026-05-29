import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import type { AdminRole } from "@prisma/client"

// ─── Augment next-auth types ──────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    id:   string
    role: AdminRole
  }
  interface Session {
    user: {
      id:    string
      name:  string
      email: string
      role:  AdminRole
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:   string
    role: AdminRole
  }
}

// ─── Auth options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  secret:   process.env.NEXTAUTH_SECRET,
  session:  { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },

  pages: {
    signIn: "/admin/login",
    error:  "/admin/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",       type: "email"    },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        if (!admin || !admin.isActive) return null

        const valid = await compare(credentials.password, admin.password)
        if (!valid) return null

        return {
          id:    admin.id,
          name:  admin.name,
          email: admin.email,
          role:  admin.role,
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = user.role
      }
      return token
    },

    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id   = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

// ─── Server helpers ───────────────────────────────────────────────────────────

export async function getAdminSession() {
  return getServerSession(authOptions)
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session?.user) redirect("/admin/login")
  return session.user
}

export async function requireSuperAdmin() {
  const user = await requireAdmin()
  if (user.role !== "SUPER_ADMIN") redirect("/admin/dashboard")
  return user
}
