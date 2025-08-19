import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find duplicate non-null barcodes among non-deleted products
  const duplicates = await prisma.product.groupBy({
    by: ['barcode'],
    where: {
      deletedAt: null,
      barcode: { not: null },
    },
    _count: { barcode: true },
    having: {
      barcode: {
        _count: { gt: 1 },
      },
    },
  });

  // Count empty-string barcodes explicitly (since unique will treat '' as a value, not NULL)
  const emptyStringCount = await prisma.product.count({
    where: { deletedAt: null, barcode: '' },
  });

  console.log('SUMMARY');
  console.log(JSON.stringify({ duplicatesCount: duplicates.length, emptyStringCount }, null, 2));

  if (duplicates.length) {
    console.log('DUPLICATE_SAMPLES');
    // Print up to 10 duplicate groups with up to 5 items each
    for (const d of duplicates.slice(0, 10)) {
      const items = await prisma.product.findMany({
        where: { deletedAt: null, barcode: d.barcode },
        select: { id: true, companyId: true, code: true, name: true, barcode: true },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });
      console.log(JSON.stringify({ barcode: d.barcode, count: d._count.barcode, items }, null, 2));
    }
  }

  if (emptyStringCount) {
    console.log('EMPTY_STRING_SAMPLES');
    const items = await prisma.product.findMany({
      where: { deletedAt: null, barcode: '' },
      select: { id: true, companyId: true, code: true, name: true, barcode: true },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    console.log(JSON.stringify({ barcode: '', count: emptyStringCount, items }, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
