import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const toFix = await prisma.product.count({
    where: { deletedAt: null, barcode: '' },
  });

  console.log(`EMPTY_BARCODE_COUNT: ${toFix}`);

  if (toFix === 0) {
    console.log('NO_CHANGES_NEEDED');
    return;
  }

  const result = await prisma.product.updateMany({
    where: { deletedAt: null, barcode: '' },
    data: { barcode: null },
  });

  console.log(`UPDATED_ROWS: ${result.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
