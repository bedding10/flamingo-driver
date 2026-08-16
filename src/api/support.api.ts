import { api } from "./client";

/**
 * Support tickets, driver side.
 *
 * The server module (SupportTicket + SupportMessage + the dashboard queue with
 * its SLA timers) was complete and had no client: a driver whose document was
 * rejected, or whose payout never arrived, could only call somebody. Every
 * route below already exists under /support/tickets.
 *
 * Complaints (/support/complaints) are deliberately NOT wired here: a complaint
 * is filed against a counterpart and needs a trip picker and an outcome the
 * driver can follow, which is a screen of its own rather than a field bolted
 * onto this one.
 */

export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

export type SupportTicketSummary = {
  id: string;
  subject: string;
  category: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  createdAt: string;
  /**
   * Included by the server on the detail route only. `type` is what decides
   * which side of the thread a message is drawn on - the driver's own user id
   * is never needed on the device for that.
   */
  sender?: { name: string | null; type: string } | null;
};

export type SupportTicketDetail = SupportTicketSummary & {
  messages: SupportTicketMessage[];
};

export type TicketPage = {
  items: SupportTicketSummary[];
  total: number;
  page: number;
  limit: number;
};

export type CreateTicketInput = {
  /** Server limit: 200 characters. */
  subject: string;
  /** Server limit: 2000 characters. It becomes the first message. */
  message: string;
  category?: string;
};

/** POST /support/tickets */
export async function createTicket(input: CreateTicketInput) {
  const { data } = await api.post("/support/tickets", input);
  return data as SupportTicketDetail;
}

/** GET /support/tickets/me */
export async function fetchMyTickets(page = 1, limit = 20) {
  const { data } = await api.get("/support/tickets/me", {
    params: { page, limit },
  });
  return data as TicketPage;
}

/**
 * GET /support/tickets/:id
 *
 * The server rejects a ticket that belongs to somebody else, so ownership is
 * never assumed here.
 */
export async function fetchTicket(id: string) {
  const { data } = await api.get("/support/tickets/" + id);
  return data as SupportTicketDetail;
}

/**
 * POST /support/tickets/:id/messages
 *
 * A reply also moves the ticket back to OPEN on the server, which is why the
 * client must refetch rather than patch the status locally. Replying to a
 * CLOSED ticket is refused by the server (400).
 */
export async function replyToTicket(id: string, body: string) {
  const { data } = await api.post("/support/tickets/" + id + "/messages", {
    body,
  });
  return data as SupportTicketMessage;
}
