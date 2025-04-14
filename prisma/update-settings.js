// CommonJS script to update time thresholds
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NEW_THRESHOLDS = [
  { name: "low", min: 0, max: 4, color: "#74e458" },     // zielony
  { name: "medium", min: 4, max: 6, color: "#d7f350" },  // żółty
  { name: "high", min: 6, max: 8, color: "#FF9800" },    // pomarańczowy
  { name: "critical", min: 8, max: 10000000, color: "#cb2b2b" } // czerwony
];

async function updateThresholds() {
  console.log('Updating time thresholds...');
  
  try {
    const result = await prisma.settings.upsert({
      where: { key: 'timeThresholds' },
      update: { value: JSON.stringify(NEW_THRESHOLDS) },
      create: { key: 'timeThresholds', value: JSON.stringify(NEW_THRESHOLDS) }
    });
    
    console.log('Time thresholds updated successfully:', result);
  } catch (error) {
    console.error('Error updating time thresholds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateThresholds(); 