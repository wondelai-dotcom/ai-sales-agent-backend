import { prisma } from "../../shared/db/prisma";

export const aiRepository = {
  findOrCreateConversation: async (companyId: string, clientId: string) => {
    const existing = await prisma.conversation.findFirst({ where: { companyId, clientId } });
    if (existing) return existing;
    return prisma.conversation.create({ data: { companyId, clientId, channel: "WEBCHAT" } });
  },

  recentMessages: (conversationId: string, take = 8) =>
    prisma.aiMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" }, take }),

  saveMessage: (conversationId: string, sender: "CLIENTE" | "AI" | "OPERATORE", content: string, actionsJson?: unknown) =>
    prisma.aiMessage.create({ data: { conversationId, sender, content, actionsJson: actionsJson as never } }),

  getClient: (companyId: string, clientId: string) => prisma.client.findFirst({ where: { id: clientId, companyId } }),

  getCompany: (companyId: string) => prisma.company.findUnique({ where: { id: companyId } }),

  listServices: (companyId: string) => prisma.service.findMany({ where: { companyId } }),

  listConversations: (companyId: string) =>
    prisma.conversation.findMany({
      where: { companyId },
      include: { client: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),

  getConversationWithMessages: (companyId: string, id: string) =>
    prisma.conversation.findFirst({
      where: { id, companyId },
      include: { client: true, messages: { orderBy: { createdAt: "asc" } } },
    }),

  // RAG minimo: recupera i chunk di documenti indicizzati dell'azienda.
  // In questa fase senza vera similarity search (serve pgvector o un vector
  // DB dedicato, vedi README): prende gli ultimi chunk indicizzati come
  // contesto grezzo. Da sostituire con una query di similarity quando la
  // decisione sul vector DB e' presa.
  latestDocumentChunks: (companyId: string, take = 20) =>
    prisma.embedding.findMany({
      where: { document: { companyId, status: "indicizzato" } },
      orderBy: { id: "desc" },
      take,
      select: { chunkText: true },
    }),
};
