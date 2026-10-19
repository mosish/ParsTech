#!/usr/bin/env tsx
/**
 * Secure Interactive CLI Command for Initial Owner / Administrator Provisioning
 * Usage:
 *   npm run admin:create-owner
 *
 * Security Rules:
 * - Never exposes a public HTTP endpoint for owner creation.
 * - Never seeds default administrator credentials.
 * - Hashes password with Argon2id before storing in PostgreSQL.
 * - Records a sanitized AuditLog entry without password or sensitive secrets.
 */

import 'dotenv/config';
import readline from 'node:readline';
import { prisma } from '../src/server/db';
import { hashPassword } from '../src/server/auth';
import { recordAuditLog } from '../src/server/audit';

function askQuestion(
  rl: readline.Interface,
  promptText: string,
  hidden = false
): Promise<string> {
  return new Promise((resolve) => {
    if (!hidden || !process.stdin.isTTY) {
      rl.question(promptText, (answer) => resolve(answer.trim()));
      return;
    }

    process.stdout.write(promptText);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let input = '';
    const onData = (char: string) => {
      if (char === '\r' || char === '\n' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input.trim());
      } else if (char === '\u0003') {
        process.stdout.write('\nAborted.\n');
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
      } else {
        input += char;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const roleArg = process.argv.find((arg) => arg.startsWith('--role='));
  const role: 'OWNER' | 'STAFF' =
    roleArg?.split('=')[1]?.toUpperCase() === 'STAFF' ? 'STAFF' : 'OWNER';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('==============================================================');
    console.log(`ParsTech Phase 1 — Interactive ${role} Account Provisioning`);
    console.log('==============================================================');

    const emailInput = await askQuestion(rl, 'Administrator Email: ');
    const email = emailInput.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('Error: A valid email address is required.');
      process.exit(1);
    }

    const fullName = await askQuestion(rl, 'Full Name: ');
    if (!fullName || fullName.length < 2) {
      console.error('Error: Full name must be at least 2 characters.');
      process.exit(1);
    }

    const password = await askQuestion(
      rl,
      'Password (minimum 12 characters, input hidden on TTY): ',
      true
    );
    if (!password || password.length < 12) {
      console.error('Error: Password must be at least 12 characters long.');
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {
        fullName,
        passwordHash,
        role,
        isActive: true,
        passwordChangedAt: new Date(),
      },
      create: {
        email,
        fullName,
        passwordHash,
        role,
        isActive: true,
      },
    });

    await recordAuditLog(
      {
        actorId: admin.id,
        action: role === 'OWNER' ? 'CLI_OWNER_PROVISIONED' : 'CLI_STAFF_PROVISIONED',
        entityType: 'AdminUser',
        entityId: admin.id,
        ipAddress: '127.0.0.1',
        metadata: {
          email: admin.email,
          role: admin.role,
          provisionedVia: 'interactive-cli',
        },
      },
      prisma
    );

    console.log(`\nSuccess: ${admin.role} account provisioned for ${admin.email} (id: ${admin.id}).`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error provisioning administrator:', err instanceof Error ? err.message : err);
  process.exit(1);
});
