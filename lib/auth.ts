import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma";
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
  invitationEmailTemplate,
} from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      const template = resetPasswordEmailTemplate(url);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
  },

  // Email verification
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const template = verificationEmailTemplate(url);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
  },

  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  // Plugins
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${APP_URL}/accept-invitation/${data.id}`;
        const template = invitationEmailTemplate({
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          organizationName: data.organization.name,
          inviteLink,
        });
        await sendEmail({
          to: data.email,
          subject: template.subject,
          html: template.html,
        });
      },
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Trusted origins for CORS
  trustedOrigins: [APP_URL],
});

export type Auth = typeof auth;
