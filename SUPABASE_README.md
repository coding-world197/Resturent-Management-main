# Supabase Integration Guide

This repository uses **Supabase** for order storage and real‑time synchronization. The following steps explain how to configure Supabase, set up the required tables, environment variables, and Row‑Level Security (RLS) policies.

---

## 1. Create a Supabase Project
1. Sign in to the Supabase dashboard and click **New project**.
2. Choose a project name (e.g., `flamebox`) and a password.
3. After the project is created, note the **API URL** and **anon public key** – you will need them for the front‑end.

---

## 2. Environment Variables
Add the following variables to your `.env` file (the file is already in the repo). **Do not commit the service‑role key.**

```dotenv
# Front‑end (client) – safe to expose
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Server‑side (back‑end) – keep secret
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Cognito (used for admin authentication)
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
```

*The front‑end only needs the `VITE_`‑prefixed variables. The server code (`src/lib/supabaseServer.js`) reads the non‑prefixed ones.*

---

## 3. Database Schema – `orders` Table
Run the following SQL in the Supabase SQL editor (or via the CLI) to create the orders table if it does not already exist.

```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id            TEXT PRIMARY KEY,
  customer      JSONB NOT NULL,
  items         JSONB NOT NULL,
  paymentMethod TEXT NOT NULL,
  subtotal      NUMERIC NOT NULL,
  delivery      NUMERIC NOT NULL,
  tax           NUMERIC NOT NULL,
  total         NUMERIC NOT NULL,
  status        TEXT NOT NULL,
  createdAt     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast ordering by creation time
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON public.orders (createdAt DESC);
```

---

## 4. Row‑Level Security (RLS)
### 4.1 Enable RLS
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```
### 4.2 Admin‑only SELECT policy
> This policy is a defense‑in‑depth measure. The admin API uses the **service‑role** key, which bypasses RLS, but keeping a restrictive policy prevents accidental exposure if a client ever obtains a normal user token.

```sql
DROP POLICY IF EXISTS "admin_can_read_orders" ON public.orders;

CREATE POLICY "admin_can_read_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

*If you use a custom claim (e.g., `cognito:groups`), adjust the `USING` clause accordingly, for example:*
```sql
USING (auth.jwt() -> 'cognito:groups' @> '"Admins"');
```

---

## 5. Server‑Side Supabase Client (Service Role)
Create `src/lib/supabaseServer.js` (if not already present) with the following content:

```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, serviceRoleKey);
```

The service‑role client has **full read/write** access and is only used by the protected admin API (`/api/admin/orders`).

---

## 6. Front‑End Supabase Usage
The front‑end already imports the anonymous client from `src/lib/supabase.js`:
```js
import { supabase } from "@/lib/supabase";
```
Use it for **inserting** new orders (checkout) and for **real‑time subscriptions** in the admin dashboard. No admin‑only operations should be performed from the client.

---

## 7. Testing the Integration
1. Run the app locally with `npm run dev`.
2. Place an order as a customer – it should be inserted into the `orders` table.
3. Open the admin dashboard in a new browser or incognito window, log in as admin, and verify that the order list loads.
4. Check the Supabase dashboard → **Table editor** → `orders` to see the newly created row.
5. In the **Realtime** tab, you should see a broadcast for the `INSERT` event.

---

## 8. Common Pitfalls
- **Missing service‑role key** – the admin API will return a 500 error. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set on the server.
- **RLS misconfiguration** – if the policy `admin_can_read_orders` is too permissive (`USING (true)`), anyone with a regular token could read all orders. Keep the `role`/`cognito:groups` check.
- **Cognito JWT not sent** – the admin API expects the JWT in an HttpOnly `admin_jwt` cookie or the `Authorization: Bearer` header. Verify the login flow sets the cookie correctly.

---

## 9. Further Resources
- Supabase Docs – [Realtime](https://supabase.com/docs/guides/realtime)
- Supabase Docs – [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- AWS Cognito – [JWT verification guide](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html)

Feel free to open an issue or ask for clarification if any step is unclear.
