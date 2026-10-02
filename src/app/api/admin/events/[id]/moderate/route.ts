import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

async function getAdminClients() {
  const session = createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Sign in as an administrator to manage events." }, { status: 401 }) };

  // Match the admin layout and other admin APIs: check the signed-in user's
  // actual admins row before using the service-role client. The RPC can return
  // false on projects where its deployed definition is out of sync.
  const { data: admin, error: adminError } = await session
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError) return { response: NextResponse.json({ error: "Could not verify administrator access. Refresh and try again." }, { status: 500 }) };
  if (!admin) return { response: NextResponse.json({ error: "This account is not authorized to manage events." }, { status: 403 }) };
  return { service: createServiceClient() };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const access = await getAdminClients();
  if (access.response) return access.response;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid event update." }, { status: 400 });
  }
  const status = body.status;
  if (status !== "draft" && status !== "published" && status !== "archived") {
    return NextResponse.json({ error: "Choose draft, published, or archived status." }, { status: 400 });
  }

  const { data, error } = await access.service!
    .from("events")
    .update({ status })
    .eq("id", params.id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const access = await getAdminClients();
  if (access.response) return access.response;

  const { data, error } = await access.service!
    .from("events")
    .delete()
    .eq("id", params.id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
