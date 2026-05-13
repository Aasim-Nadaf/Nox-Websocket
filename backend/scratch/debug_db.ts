import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '6a041e476ffc85654866b872';
  const otherUserId = '6a041e286ffc85654866b871';

  console.log('Querying for messages between:', userId, 'and', otherUserId);

  const allMessages = await prisma.message.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log('Last 10 messages in DB:');
  console.log(JSON.stringify(allMessages, null, 2));

  const messagesNoGroupIdFilter = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }
  });

  console.log('--- Detailed check ---');
  messagesNoGroupIdFilter.forEach((msg, i) => {
    console.log(`Msg ${i}: content="${msg.content}", groupId=${msg.groupId}, hasOwnProperty('groupId')=${Object.prototype.hasOwnProperty.call(msg, 'groupId')}`);
  });

  const directMessagesWithUndefined = await prisma.message.findMany({
    where: {
      AND: [
        {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ]
        },
        {
          OR: [
            { groupId: null },
            // @ts-ignore - check if this works for MongoDB undefined
            { groupId: { isSet: false } }
          ]
        }
      ]
    }
  });

  console.log('Direct messages found (with OR null/isSet:false):', directMessagesWithUndefined.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
