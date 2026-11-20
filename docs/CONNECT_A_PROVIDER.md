# Connect your booking system

Put AI assistants in front of your booking system without building an MCP server yourself. You implement the [provider contract](PROVIDER_CONTRACT.md); the gateway does the agent side.

Use fictional data only while testing.

## 1. Try the whole path locally, with no booking system

```sh
npm ci
npm run test:e2e
```

This starts the in-memory reference provider (`test/e2e/fixture-provider.js`) and the gateway as two processes. A real MCP SDK client then finds a slot, proposes a booking, lets a simulated customer approve it, books it and finds it in the calendar. It also covers an expired approval, a changed price, a taken slot and a rate limit. Read the fixture next to the contract: it is about 200 lines and shows every rule.

## 2. Implement the contract

Implement the seven routes in [PROVIDER_CONTRACT.md](PROVIDER_CONTRACT.md) in your system. The parts that matter most:

- Check both the gateway's service token and the agent's credential on every route.
- Never give the agent the customer's approval link. Deliver it to the customer yourself.
- Bind each mandate to the exact terms, and check it again when the booking is created.
- Require `Idempotency-Key` for bookings.

## 3. Check conformance

Generate a service token and give the same value to your provider and the check. Keep it out of Git, URLs and logs.

```sh
export GATEWAY_SERVICE_TOKEN="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
export PROVIDER_ORIGIN=https://booking.example.test   # or http://127.0.0.1:<port> locally
export PROVIDER_BUSINESS=<your business id>
export PROVIDER_AGENT_KEY=<a test agent credential your system issued>
npm run provider:check            # read-only
npm run provider:check -- --write # also creates one pending proposal
```

Every check prints `PASS`, `FAIL`, `WARN` or `SKIP` with what the contract expects. The check never books anything: the only booking attempts it makes are ones the contract requires you to refuse. It prints no credentials.

## 4. Run the agent scenarios against your system

Write an adapter: a module that starts or connects to your provider and gives the test what only you can do.

```js
// my-adapter.mjs
export async function start({ serviceToken, day, gatewayOrigin }) {
  // Start or connect to a test instance that accepts serviceToken as the gateway token,
  // with one free service and staff member on `day` (YYYY-MM-DD).
  return {
    salon: "http://127.0.0.1:4000",          // provider origin
    agentKey: "…",                            // a test agent credential, kept in memory
    business: "demo",                         // optional, default "demo"
    customer: { name: "…", email: "…@example.test" }, // optional: the customer your approval binds
    async approve(proposal, expired = false) {
      // Act as the customer: approve this proposal through your own channel.
      // With expired=true, show that approval is refused and no mandate is created.
    },
    async owner(action, input) {
      // Salon-side test controls:
      // "calendar" {bookingId, start} → {bookings:[{id}]} from the salon calendar
      // "expire" {mandateId}, "expireProposal" {proposalId}
      // "price" {serviceId, amountMinor}, "occupy" {serviceId, staffId, start}
      // "stats" → {stats:{proposalsCreated, bookingsCreated}} for this agent
    },
    async close() {},
  };
}
```

```sh
npm run test:e2e -- --adapter ./my-adapter.mjs
```

`scripts/real/operator.mjs` is the adapter for Cresavo, a complete working example against a real database.

## 5. Run the gateway in front of your system

```sh
SALON_ORIGIN=https://booking.example.test GATEWAY_SERVICE_TOKEN=… npm start
```

For hosting beyond loopback, see [HOSTING.md](HOSTING.md). Then point an MCP client at `/api/v1/mcp` with an agent credential from your system.

## Support

Open an issue for questions about the contract. Report security problems privately, see [SECURITY.md](../SECURITY.md).
