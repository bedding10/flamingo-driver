import { api } from "./client";

/**
 * Emergency contacts, driver side.
 *
 * This is the missing half of the SOS feature. SafetyService.dispatchSos()
 * reads up to five EmergencyContact rows for the reporter and sends each one an
 * SMS with the position - so a driver with no contacts saved presses SOS and
 * nobody who loves them is told. The table and the fan-out existed; the screen
 * to fill the table did not.
 *
 * Routes are under /emergency-contacts and are scoped to the caller by the
 * server (`user.userId`), never by an id sent from the device.
 */

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string | null;
  createdAt: string;
};

export type EmergencyContactInput = {
  /** Server limits: 2-80 characters. */
  name: string;
  /** Server limits: 4-20 characters. */
  phone: string;
  /** Server limit: 40 characters. */
  relation?: string;
};

/** GET /emergency-contacts/me */
export async function fetchMyContacts() {
  const { data } = await api.get("/emergency-contacts/me");
  return data as EmergencyContact[];
}

/** POST /emergency-contacts */
export async function createContact(input: EmergencyContactInput) {
  const { data } = await api.post("/emergency-contacts", input);
  return data as EmergencyContact;
}

/** PATCH /emergency-contacts/:id */
export async function updateContact(
  id: string,
  input: Partial<EmergencyContactInput>,
) {
  const { data } = await api.patch("/emergency-contacts/" + id, input);
  return data as EmergencyContact;
}

/** DELETE /emergency-contacts/:id */
export async function deleteContact(id: string) {
  const { data } = await api.delete("/emergency-contacts/" + id);
  return data as { ok?: boolean };
}
