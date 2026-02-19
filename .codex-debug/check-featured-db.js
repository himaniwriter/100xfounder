const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const enums = await prisma.$queryRawUnsafe(
      "SELECT t.typname AS enum_name, e.enumlabel AS label FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('featured_plan','featured_request_status') ORDER BY t.typname, e.enumsortorder",
    );
    const columns = await prisma.$queryRawUnsafe(
      "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'featured_founder_requests' ORDER BY ordinal_position",
    );
    const sample = await prisma.$queryRawUnsafe(
      "SELECT id, founder_name, company_name, plan::text as plan, status::text as status, created_at FROM public.featured_founder_requests ORDER BY created_at DESC LIMIT 3",
    );

    console.log(JSON.stringify({ enums, columns, sample }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
