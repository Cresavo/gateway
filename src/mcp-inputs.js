// SPDX-License-Identifier: AGPL-3.0-only
import { z } from "zod";
const id = z.string().trim().min(1).max(128);
export const proposalSchema = z.object({
  business: id, serviceId: id, serviceVersion: z.number().int().positive(),
  staffId: id, start: z.iso.datetime({ offset: true }),
  customerPhone: z.string().max(32).optional(),
}).strict();

const business = z.string().describe("Business id authorised by the configured API key.");
// Shared by native tools, USP name aliases and their published native schema.
export const mcpInputs = {
  create_proposal: proposalSchema,
  get_proposal: z.object({ proposalId: z.string().min(1).max(128) }).strict(),
  list_services: z.object({ business }).strict(),
  get_service: z.object({ business, service: z.string() }).strict(),
  get_availability: z.object({
    business, service: z.string(), date: z.string().optional(),
    from: z.string().optional(), to: z.string().optional(), staff: z.string().optional(),
  }).strict(),
  create_booking: z.object({
    idempotencyKey: z.string(), business, serviceId: z.string(), serviceVersion: z.number().int(),
    staffId: z.string(), start: z.string(), customer: z.object({ name: z.string(), email: z.string() }).strict(),
    confirmed: z.boolean(), mandateId: z.string().optional(),
  }).strict(),
  get_booking: z.object({ bookingId: z.string() }).strict(),
  cancel_booking: z.object({ bookingId: z.string() }).strict(),
};
export const uspAliases = {
  usp_services_list: "list_services", usp_services_get: "get_service",
  usp_availability_query: "get_availability", usp_bookings_create: "create_booking",
  usp_bookings_get: "get_booking",
};

export function nativeMcpSchema() {
  const definitions = {
    ...Object.fromEntries(Object.entries(mcpInputs).filter(([name]) => name !== "get_service")),
    ...Object.fromEntries(Object.entries(uspAliases).map(([name, native]) => [name, mcpInputs[native]])),
  };
  return {
    openrpc: "1.3.2", info: { title: "Booking Lab native MCP inputs and USP name aliases", version: "v1-sandbox" },
    "x-booking-lab-compatibility": "Native v1 parameters/results; not the canonical USP wire binding.",
    methods: Object.entries(definitions).map(([name, input]) => {
      const schema = z.toJSONSchema(input);
      return { name, paramStructure: "by-name", params: Object.entries(schema.properties ?? {}).map(([field, type]) => ({
        name: field, required: schema.required?.includes(field) ?? false, schema: type,
      })), result: { name: "result", schema: { type: "object" } } };
    }),
  };
}
