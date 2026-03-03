import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;

console.log("Connecting to database...");

// Pool with SSL support for self-signed certificates
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const shelfLocations = [
  {
    name: "Rack 1",
    category: "Cardiology",
    description: "Cardiovascular medications",
    aisleNumber: "A",
    rowNumber: 1,
  },
  {
    name: "Rack 2",
    category: "Antibiotics",
    description: "Antibiotic medications",
    aisleNumber: "A",
    rowNumber: 2,
  },
  {
    name: "Rack 3",
    category: "Pain Management",
    description: "Pain relief medications",
    aisleNumber: "B",
    rowNumber: 1,
  },
  {
    name: "Shelf A1",
    category: "Diabetes",
    description: "Diabetes management medications",
    aisleNumber: "B",
    rowNumber: 2,
  },
  {
    name: "Shelf A2",
    category: "Respiratory",
    description: "Respiratory medications",
    aisleNumber: "C",
    rowNumber: 1,
  },
  {
    name: "Shelf B1",
    category: "General",
    description: "General medications",
    aisleNumber: "C",
    rowNumber: 2,
  },
];

async function main() {
  console.log("Seeding database...");

  for (const location of shelfLocations) {
    const existing = await prisma.shelfLocation.findFirst({
      where: { name: location.name },
    });

    if (!existing) {
      await prisma.shelfLocation.create({
        data: {
          name: location.name,
          category: location.category ? {
            connectOrCreate: {
              where: {
                pharmacyId_name: {
                  pharmacyId: "system", // Use a placeholder or null if pharmacy scoping is needed
                  name: location.category,
                }
              },
              create: {
                name: location.category,
                pharmacyId: "system",
                color: "blue",
              }
            }
          } : undefined,
          description: location.description,
          aisleNumber: location.aisleNumber,
          rowNumber: location.rowNumber,
        },
      });
      console.log(`Created: ${location.name}`);
    } else {
      console.log(`Skipped (exists): ${location.name}`);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
