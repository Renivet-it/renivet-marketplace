"use client";

import { useState, useRef, useEffect } from "react";
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
  // -------------------------------
  // Tickets
  // -------------------------------
  const [tickets, setTickets] = useState(
    Array.from({ length: 12 }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Support Ticket #${i + 1}`,
      issueType: i % 2 ? "orders" : "payouts",
      status: i % 3 ? "open" : "resolved",
      createdAt: new Date().toISOString(),
    }))
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const [selectedTicketId, setSelectedTicketId] = useState("1");

  // -------------------------------
  // Messages
  // -------------------------------
  const [messages, setMessages] = useState([
    {
      id: "m1",
      ticketId: "1",
      sender: "brand",
      text: "Hello, payout still not received.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "m2",
      ticketId: "1",
      sender: "admin",
      text: "We are checking your issue.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const msgList = messages.filter((m) => m.ticketId === selectedTicketId);

  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgList]);

  const [msgText, setMsgText] = useState("");

  function sendMessage() {
    if (!msgText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        ticketId: selectedTicketId,
        sender: "brand",
        text: msgText,
        createdAt: new Date().toISOString(),
      },
    ]);

    setMsgText("");
  }

  // -------------------------------
  // Create Ticket
  // -------------------------------
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIssue, setNewIssue] = useState("orders");
  const [newDesc, setNewDesc] = useState("");

  function createTicket() {
    const id = Math.random().toString();

    setTickets((prev) => [
      {
        id,
        title: newTitle,
        issueType: newIssue,
        status: "open",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setMessages((prev) => [
      ...prev,
      {
        id: "msg_" + Math.random(),
        ticketId: id,
        sender: "brand",
        text: newDesc,
        createdAt: new Date().toISOString(),
      },
    ]);

    setSelectedTicketId(id);
    setNewOpen(false);
  }

  // -------------------------------
  // Resolved Check
  // -------------------------------
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const isResolved = selectedTicket?.status === "resolved";

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">

      {/* SIDEBAR */}
      <Card className="h-[85vh] flex flex-col md:col-span-1 border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Support</h2>

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
                    <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="payouts">Payouts</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe your issue"
                    value={newDesc}
                    rows={4}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />

                  <Button className="w-full" onClick={createTicket}>
                    Create Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 🔥 FILTERS ADDED BACK HERE */}
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

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {filteredTickets.map((t) => (
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

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {msgList.map((m) => (
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

        {/* SHOW RESOLVED NOTICE */}
        {isResolved ? (
          <div className="p-4 border-t bg-muted text-center text-sm font-medium">
            This ticket has been resolved by the admin. You cannot send more messages.
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
