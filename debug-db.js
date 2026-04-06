const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDb() {
  const userCount = await prisma.user.count();
  const recordCount = await prisma.financialRecord.count();
  console.log(`Users: ${userCount}`);
  console.log(`Records: ${recordCount}`);
  
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log("Admin User found:", admin?.email);
  
  const records = await prisma.financialRecord.findMany({ take: 5 });
  console.log("First 5 records:", records);
}

checkDb().finally(() => prisma.$disconnect());
