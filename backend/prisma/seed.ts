import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test company
  const company = await prisma.company.upsert({
    where: { taxNumber: '1234567890' },
    update: {},
    create: {
      name: 'Test Restaurant',
      taxNumber: '1234567890',
      taxOffice: 'Test Vergi Dairesi',
      address: 'Test Adres',
      phone: '+90 555 123 4567',
      email: 'test@restaurant.com',
    },
  });

  // Create test categories
  const mainCategory = await prisma.category.upsert({
    where: { id: 'cat1' },
    update: {},
    create: {
      id: 'cat1',
      companyId: company.id,
      name: 'Ana Yemekler',
      description: 'Ana yemek kategorisi',
      displayOrder: 1,
    },
  });

  const drinkCategory = await prisma.category.upsert({
    where: { id: 'cat2' },
    update: {},
    create: {
      id: 'cat2',
      companyId: company.id,
      name: 'İçecekler',
      description: 'İçecek kategorisi',
      displayOrder: 2,
    },
  });

  const dessertCategory = await prisma.category.upsert({
    where: { id: 'cat3' },
    update: {},
    create: {
      id: 'cat3',
      companyId: company.id,
      name: 'Tatlılar',
      description: 'Tatlı kategorisi',
      displayOrder: 3,
    },
  });

  const starterCategory = await prisma.category.upsert({
    where: { id: 'cat4' },
    update: {},
    create: {
      id: 'cat4',
      companyId: company.id,
      name: 'Başlangıçlar',
      description: 'Başlangıç kategorisi',
      displayOrder: 4,
    },
  });

  // Create test taxes
  const tax8 = await prisma.tax.upsert({
    where: { id: 'tax1' },
    update: {},
    create: {
      id: 'tax1',
      companyId: company.id,
      name: 'KDV %8',
      rate: 8.00,
      code: 'VAT8',
      type: 'VAT',
      isDefault: false,
      isIncluded: true,
      active: true,
    },
  });

  const tax18 = await prisma.tax.upsert({
    where: { id: 'tax2' },
    update: {},
    create: {
      id: 'tax2',
      companyId: company.id,
      name: 'KDV %18',
      rate: 18.00,
      code: 'VAT18',
      type: 'VAT',
      isDefault: true,
      isIncluded: true,
      active: true,
    },
  });

  const tax1 = await prisma.tax.upsert({
    where: { id: 'tax3' },
    update: {},
    create: {
      id: 'tax3',
      companyId: company.id,
      name: 'KDV %1',
      rate: 1.00,
      code: 'VAT1',
      type: 'VAT',
      isDefault: false,
      isIncluded: true,
      active: true,
    },
  });

  console.log('Seed data created successfully!');
  console.log('Company ID:', company.id);
  console.log('Categories:', [mainCategory.id, drinkCategory.id, dessertCategory.id, starterCategory.id]);
  console.log('Taxes:', [tax8.id, tax18.id, tax1.id]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });