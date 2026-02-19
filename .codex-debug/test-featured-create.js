const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.featuredFounderRequest.create({
      data: {
        founderName: 'Debug Founder',
        workEmail: `debug_${Date.now()}@acme.com`,
        companyName: 'Debug Co',
        productSummary: 'This is a debug insert to validate featured request persistence.',
        plan: 'STARTER',
        priceInr: 9900,
        priceUsd: 149,
        source: 'site_form',
      },
      select: { id: true, status: true, plan: true },
    });

    console.log(JSON.stringify(row, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
