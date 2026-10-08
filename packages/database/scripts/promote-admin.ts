import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error(
      "❌ Error: Email is required.\nUsage: pnpm admin:promote <email>",
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ Error: User with email "${email}" not found.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: Role.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  console.log(
    `✅ Success: User "${updated.name}" (${updated.email}) is now an ${updated.role}!`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error promoting user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
