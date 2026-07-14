import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/crypto';

const prisma = new PrismaClient();

async function run() {
  console.log('Starte Bereinigung und Zurücksetzen der Dummy-Accounts...');

  try {
    // 1. Sicherstellen, dass das TaskType-Element 'lin_alg_det' in der DB existiert
    await prisma.taskType.upsert({
      where: { id: 'lin_alg_det' },
      update: {},
      create: {
        id: 'lin_alg_det',
        name: '2x2 Determinante',
        module: 'Lineare Algebra'
      }
    });

    // 2. Suche alle User, die mit "user_" anfangen (vitest Test-Dummies)
    const testUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'user_'
        }
      }
    });

    console.log(`Lösche ${testUsers.length} Vitest-Test-Dummy-User...`);
    
    for (const u of testUsers) {
      // Kaskadierendes Löschen durch onDelete: Cascade in Prisma gelöst,
      // aber wir löschen die SolvedTasks zur Sicherheit explizit zuerst
      await prisma.solvedTask.deleteMany({
        where: { userId: u.id }
      });
      await prisma.user.delete({
        where: { id: u.id }
      });
    }

    // 3. Konfiguriere die 3 gewünschten Standard-Dummy-Accounts
    const dummies = [
      {
        username: 'alex_study',
        displayName: 'Alex (LA-Tutor)',
        points: 15
      },
      {
        username: 'emma_info',
        displayName: 'Emma',
        points: 10
      },
      {
        username: 'lukas_math',
        displayName: 'Lukas',
        points: 6
      }
    ];

    const passwordHash = hashPassword('dummyPassword123');

    for (const d of dummies) {
      console.log(`Setze Dummy-User @${d.username} (${d.displayName}) mit ${d.points} Punkten auf...`);

      // Erstellen oder Updaten des Dummy-Users
      const user = await prisma.user.upsert({
        where: { username: d.username },
        update: {
          displayName: d.displayName,
          passwordHash
        },
        create: {
          username: d.username,
          displayName: d.displayName,
          passwordHash
        }
      });

      // Zuerst alle bisherigen gelösten Aufgaben dieses Dummies löschen
      await prisma.solvedTask.deleteMany({
        where: { userId: user.id }
      });

      // Erzeuge exakt d.points SolvedTask-Einträge
      const solvedTasksData = Array.from({ length: d.points }).map(() => ({
        userId: user.id,
        taskTypeId: 'lin_alg_det',
        solvedAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)) // Zufälliges Datum der letzten 10 Tage
      }));

      await prisma.solvedTask.createMany({
        data: solvedTasksData
      });
    }

    console.log('Datenbank erfolgreich zurückgesetzt und bereinigt!');
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Datenbank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
