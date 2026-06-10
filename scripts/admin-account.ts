/**
 * CLI script to manage admin accounts for /admin/login.
 *
 * Admin login authenticates by EMAIL + password against a User whose
 * role is "admin". Passwords are bcrypt-hashed and cannot be recovered —
 * use this script to list admins, reset a password, or create an admin.
 *
 * Requires DATABASE_URL to point at the target database (e.g. production).
 *
 * Usage:
 *   # List all admin accounts (emails / usernames)
 *   npx tsx scripts/admin-account.ts list
 *
 *   # Reset the password of an existing admin (by email)
 *   npx tsx scripts/admin-account.ts reset --email you@example.com --password "NewPass123"
 *
 *   # Promote an existing user to admin AND set a password (by email)
 *   npx tsx scripts/admin-account.ts promote --email you@example.com --password "NewPass123"
 *
 *   # Create a brand-new admin account
 *   npx tsx scripts/admin-account.ts create \
 *     --email you@example.com --username youradmin --password "NewPass123"
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(3); // skip node, script, command
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    result[key] = args[i + 1];
  }
  return result;
}

async function list() {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, email: true, username: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (admins.length === 0) {
    console.log("⚠️  No admin accounts found.");
    console.log("   Create one with: npx tsx scripts/admin-account.ts create --email ... --username ... --password ...");
    return;
  }

  console.log(`Found ${admins.length} admin account(s):\n`);
  for (const a of admins) {
    console.log(`  • email:    ${a.email}`);
    console.log(`    username: ${a.username}`);
    console.log(`    id:       ${a.id}`);
    console.log(`    created:  ${a.createdAt.toISOString()}\n`);
  }
}

async function reset({ requireAdminRole }: { requireAdminRole: boolean }) {
  const args = parseArgs();
  if (!args.email || !args.password) {
    console.error("Error: --email and --password are required");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: args.email } });
  if (!user) {
    console.error(`Error: no user found with email ${args.email}`);
    process.exit(1);
  }
  if (requireAdminRole && user.role !== "admin") {
    console.error(
      `Error: user ${args.email} has role "${user.role}", not "admin".\n` +
        `   Use the "promote" command to grant admin AND set a password.`
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(args.password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      role: requireAdminRole ? user.role : "admin",
    },
  });

  console.log(`✅ Password updated for ${args.email}`);
  if (!requireAdminRole && user.role !== "admin") {
    console.log(`   Role promoted: ${user.role} → admin`);
  }
  console.log(`   You can now log in at /admin/login`);
}

async function create() {
  const args = parseArgs();
  if (!args.email || !args.username || !args.password) {
    console.error("Error: --email, --username and --password are required");
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: args.email }, { username: args.username }] },
  });
  if (existing) {
    console.error(
      `Error: a user with that ${existing.email === args.email ? "email" : "username"} already exists.\n` +
        `   Use the "promote" command to make an existing user an admin.`
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(args.password, 10);
  const user = await prisma.user.create({
    data: {
      email: args.email,
      username: args.username,
      passwordHash,
      role: "admin",
    },
    select: { id: true, email: true, username: true },
  });

  console.log(`✅ Admin account created:`);
  console.log(`   email:    ${user.email}`);
  console.log(`   username: ${user.username}`);
  console.log(`   id:       ${user.id}`);
  console.log(`   Log in at /admin/login`);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "list":
      await list();
      break;
    case "reset":
      await reset({ requireAdminRole: true });
      break;
    case "promote":
      await reset({ requireAdminRole: false });
      break;
    case "create":
      await create();
      break;
    default:
      console.error(
        "Usage: npx tsx scripts/admin-account.ts <list|reset|promote|create> [options]\n" +
          "  list     List all admin accounts\n" +
          "  reset    Reset password of an existing admin   (--email --password)\n" +
          "  promote  Make an existing user an admin + set pw (--email --password)\n" +
          "  create   Create a new admin account             (--email --username --password)"
      );
      process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
