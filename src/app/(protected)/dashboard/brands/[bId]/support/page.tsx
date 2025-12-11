"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea-dash";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog-dash";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select-dash";

export default function BrandSupportPage() {
  // ------------------------------------------------
  // FILTER STATE
  // ------------------------------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ------------------------------------------------
  // TRPC → LIST TICKETS
  // ------------------------------------------------
  const ticketsQuery = trpc.brands.brandSupportRouter.listTickets.useQuery({
    limit: 50,
    page: 1,
    search,
    status: statusFilter,
  });

  const tickets = ticketsQuery.data?.data ?? [];

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // auto-select first ticket
  useEffect(() => {
    if (!selectedTicketId && tickets?.length > 0) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  // ------------------------------------------------
  // TRPC → GET TICKET DETAILS
  // ------------------------------------------------
  const ticketQuery = trpc.brands.brandSupportRouter.getTicket.useQuery(
    selectedTicketId ?? "",
    { enabled: !!selectedTicketId }
  );

  const selectedTicket = ticketQuery.data;
  const isResolved = selectedTicket?.status === "resolved";

  // ------------------------------------------------
  // TRPC → GET MESSAGES
  // ------------------------------------------------
  const messagesQuery = trpc.brands.brandSupportRouter.getMessages.useQuery(
    selectedTicketId ?? "",
    { enabled: !!selectedTicketId }
  );

  const messages = messagesQuery.data ?? [];

  // scroll bottom
  const chatRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------
  // TRPC → SEND MESSAGE
  // ------------------------------------------------
  const sendMessageMutation = trpc.brands.brandSupportRouter.sendMessage.useMutation({
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

  // ------------------------------------------------
  // TRPC → CREATE TICKET
  // ------------------------------------------------
  const createTicketMutation = trpc.brands.brandSupportRouter.createTicket.useMutation({
    onSuccess: async (ticket) => {
      await ticketsQuery.refetch();
      setSelectedTicketId(ticket.id);
      setNewOpen(false);
      setNewTitle("");
      setNewDesc("");
    },
  });

  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIssue, setNewIssue] = useState("orders");
  const [newDesc, setNewDesc] = useState("");

  function createTicket() {
    createTicketMutation.mutate({
      title: newTitle,
      issueType: newIssue,
      description: newDesc,
    });
  }

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">

      {/* SIDEBAR */}
      <Card className="h-[85vh] flex flex-col md:col-span-1 border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Support</h2>

            {/* CREATE TICKET MODAL */}
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button size="sm">New</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Ticket</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  <Select value={newIssue} onValueChange={setNewIssue}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="payouts">Payouts</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe your issue..."
                    rows={4}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />

                  <Button className="w-full" onClick={createTicket}>
                    Create Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* FILTERS */}
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
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
                  selectedTicketId === t.id ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{t.title}</p>
                  <Badge variant="outline">{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.issueType}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* CHAT */}
      <Card className="h-[85vh] flex flex-col md:col-span-3 border">
        <CardHeader>
          <h2 className="text-xl font-semibold">Conversation</h2>
        </CardHeader>

        <Separator />

        {/* CHAT LOG */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {(messages ?? []).map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg max-w-xl text-sm ${
                  m.sender === "brand"
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

            <div ref={chatRef} />
          </div>
        </ScrollArea>

        {/* IF RESOLVED SHOW LOCK */}
        {isResolved ? (
          <div className="p-4 border-t bg-muted text-center text-sm font-medium">
            This ticket has been resolved. You cannot send more messages.
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
      </Card>
    </div>
  );
}
