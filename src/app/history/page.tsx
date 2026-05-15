import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, conversations } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    redirect("/api/auth/signin");
  }

  const userId = (session.user as any).id as string;

  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 bg-zinc-50">
      <div className="z-10 max-w-5xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-bold">Histórico de Conversas</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Nova Conversa
          </Link>
        </div>

        {userConversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-700">Nenhuma conversa encontrada</h2>
            <p className="text-zinc-500 mt-2">Você ainda não iniciou nenhuma conversa com o Orbita.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userConversations.map((conv) => (
              <Link href={`/?id=${conv.id}`} key={conv.id}>
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-800">
                      {conv.title || "Conversa sem título"}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {new Date(conv.updatedAt || conv.createdAt || Date.now()).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
