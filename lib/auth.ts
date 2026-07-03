import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const business = await prisma.business.findUnique({
          where: { email: credentials.email },
        });
        if (!business) return null;
        const valid = await bcrypt.compare(credentials.password, business.passwordHash);
        if (!valid) return null;
        return {
          id: business.id,
          email: business.email,
          name: business.ownerName,
          businessId: business.id,
          businessSlug: business.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.businessId = (user as any).businessId;
        token.businessSlug = (user as any).businessSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessSlug = token.businessSlug;
      }
      return session;
    },
  },
};
