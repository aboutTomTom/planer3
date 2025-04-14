// Import PrismaClient from the specific generated location
const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

async function checkTasks() {
  try {
    // Get total count of tasks
    const totalCount = await prisma.task.count();
    console.log(`Total tasks in database: ${totalCount}`);
    
    // Count tasks for weeks 15-17
    const weeklyTasks = await prisma.task.count({
      where: {
        title: {
          startsWith: '[W'
        }
      }
    });
    console.log(`Tasks for specific weeks: ${weeklyTasks}`);
    
    // Get a sample of tasks for weeks 15-17
    const sampleTasks = await prisma.task.findMany({
      where: {
        title: {
          startsWith: '[W'
        }
      },
      select: {
        id: true,
        title: true,
        priority: true,
        estimatedTime: true,
        assignedToId: true,
        brand: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });
    
    console.log('Sample tasks:');
    console.log(JSON.stringify(sampleTasks, null, 2));
    
    // Count tasks by week
    const week15Count = await prisma.task.count({
      where: {
        title: {
          startsWith: '[W15]'
        }
      }
    });
    
    const week16Count = await prisma.task.count({
      where: {
        title: {
          startsWith: '[W16]'
        }
      }
    });
    
    const week17Count = await prisma.task.count({
      where: {
        title: {
          startsWith: '[W17]'
        }
      }
    });
    
    console.log(`Week 15 tasks: ${week15Count}`);
    console.log(`Week 16 tasks: ${week16Count}`);
    console.log(`Week 17 tasks: ${week17Count}`);
    
  } catch (error) {
    console.error('Error checking tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks()
  .then(() => console.log('Task check complete'))
  .catch(error => console.error('Error running check:', error)); 