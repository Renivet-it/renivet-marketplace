"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function AdminSupportPage() {
  // --------------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // --------------------------------------------------------
  // TRPC → LIST ALL TICKETS (ADMIN)
  // --------------------------------------------------------
  const ticketsQuery = trpc.general.adminSupportRouter.listTickets.useQuery({
    limit: 50,
    page: 1,
    search,
    status: statusFilter,
  });

  const tickets = ticketsQuery.data?.data ?? [];

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // auto-select the first ticket
  useEffect(() => {
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  // --------------------------------------------------------
  // TRPC → GET TICKET DETAILS
  // --------------------------------------------------------
  const ticketQuery =trpc.general.adminSupportRouter.getTicket.useQuery(
    selectedTicketId ?? "",
    { enabled: !!selectedTicketId }
  );

  const selectedTicket = ticketQuery.data;
  const isResolved = selectedTicket?.status === "resolved";

  // --------------------------------------------------------
  // TRPC → GET MESSAGES FOR TICKET
  // --------------------------------------------------------
  const messagesQuery =trpc.general.adminSupportRouter.getMessages.useQuery(
    selectedTicketId ?? "",
    { enabled: !!selectedTicketId }
  );

  const messages = messagesQuery.data ?? [];

  const chatRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------------
  // TRPC → SEND ADMIN MESSAGE
  // --------------------------------------------------------
  const sendMessageMutation =trpc.general.adminSupportRouter.sendMessage.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      setMsgText("");
    },
  });

  const [msgText, setMsgText] = useState("");

  function sendMessage() {
    if (!msgText.trim() || !selectedTicketId) return;

    sendMessageMutation.mutate({
      ticketId: selectedTicketId,
      text: msgText,
    });
  }

  // --------------------------------------------------------
  // TRPC → RESOLVE TICKET
  // --------------------------------------------------------
  const resolveMutation =trpc.general.adminSupportRouter.resolveTicket.useMutation({
    onSuccess: async () => {
      await ticketsQuery.refetch();
      await ticketQuery.refetch();
    },
  });

  function resolveTicketHandler() {
    if (!selectedTicketId) return;
    resolveMutation.mutate({ ticketId: selectedTicketId });
  }

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">

      {/* SIDEBAR */}
      <Card className="h-[85vh] flex flex-col border md:col-span-1">
        <CardHeader>
          <h2 className="text-xl font-semibold">Admin Support Panel</h2>

          {/* FILTERS */}
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border p-2 rounded-md text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
        </CardHeader>

        <Separator />

        {/* TICKET LIST */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-3 rounded-md cursor-pointer border transition ${
                  selectedTicketId === t.id ? "bg-muted" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{t.title}</p>
                  <Badge variant="outline">{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.issueType}
                </p>
                <p className="text-xs mt-1 text-muted-foreground italic">
                  Brand: {t.brandName ?? "Unknown"}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* CHAT AREA */}
      <Card className="h-[85vh] flex flex-col md:col-span-3 border">

        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Conversation</h2>

          {/* RESOLVE BUTTON */}
          {!isResolved && selectedTicketId && (
            <Button variant="secondary" onClick={resolveTicketHandler}>
              Mark as Resolved
            </Button>
          )}
        </CardHeader>

        <Separator />

        {/* CHAT + INPUT */}
        <>
          {/* MESSAGES */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg max-w-xl text-sm ${
                    m.sender === "admin"
                      ? "bg-primary/10 ml-auto"
                      : "bg-muted mr-auto"
                  }`}
                >
                  {m.text}
                  <div className="text-[10px] text-muted-foreground mt-2">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}

              <div ref={chatRef}></div>
            </div>
          </ScrollArea>

          {/* LOCKED WHEN RESOLVED */}
          {isResolved ? (
            <div className="p-4 border-t bg-muted text-center text-sm font-medium">
              This ticket has been resolved. Chat is locked.
            </div>
          ) : (
            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Write a message..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          )}
        </>
      </Card>
    </div>
  );
}
