"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function AdminSupportPage() {
  // ----------------------------
  // TICKET LIST
  // ----------------------------
  const [tickets, setTickets] = useState(
    Array.from({ length: 100 }).map((_, i) => ({
      id: `${i + 1}`,
      brandName: `Brand ${i + 1}`,
      title: `Ticket ${i + 1}`,
      issueType: i % 2 ? "orders" : "payouts",
      status: i % 3 ? "open" : "resolved",
      createdAt: new Date().toISOString(),
    }))
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("1");

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchFilter;
  });

  // ----------------------------
  // MESSAGES
  // ----------------------------
  const [messages, setMessages] = useState([
    {
      id: "m1",
      ticketId: "1",
      sender: "brand",
      text: "Hello, payout not received!",
      createdAt: new Date().toISOString(),
    },
    {
      id: "m2",
      ticketId: "1",
      sender: "admin",
      text: "We are checking this now.",
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

    const newMessage = {
      id: Math.random().toString(),
      ticketId: selectedTicketId,
      sender: "admin",
      text: msgText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMsgText("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">

      {/* ADMIN SIDEBAR */}
      <Card className="h-[85vh] flex flex-col md:col-span-1 border">
        <CardHeader>
          <h2 className="text-xl font-semibold">Admin Support Panel</h2>

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
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardHeader>

        <Separator />

        {/* Ticket list */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-3 rounded-md cursor-pointer border transition 
                  ${selectedTicketId === t.id ? "bg-muted" : "hover:bg-muted/40"}`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{t.title}</p>
                  <Badge variant="outline">{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.issueType}</p>
                <p className="text-xs mt-1 text-muted-foreground italic">
                  Brand: {t.brandName}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* CHAT AREA */}
      <Card className="h-[85vh] flex flex-col md:col-span-3 border">

        {/* HEADER + RESOLVE BUTTON */}
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Conversation</h2>

          {tickets.find((t) => t.id === selectedTicketId)?.status !== "resolved" && (
            <Button
              variant="secondary"
              onClick={() => {
                setTickets((prev) =>
                  prev.map((x) =>
                    x.id === selectedTicketId ? { ...x, status: "resolved" } : x
                  )
                );
              }}
            >
              Mark as Resolved
            </Button>
          )}
        </CardHeader>

        <Separator />

        {(() => {
          const t = tickets.find((x) => x.id === selectedTicketId);
          const isResolved = t?.status === "resolved";

          return (
            <>
              {/* CHAT MESSAGES */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {msgList.map((m) => (
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
                  <div ref={chatRef} />
                </div>
              </ScrollArea>

              {/* WHEN RESOLVED – SHOW LOCK MESSAGE */}
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
          );
        })()}
      </Card>
    </div>
  );
}
