import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/slugify";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const bucket = "logos";
const maxLogoBytes = 5 * 1024 * 1024;
const allowedLogoTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: "Sign in as an administrator to continue.", status: 401 as const };

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !admin) return { ok: false as const, error: "Administrator access is required.", status: 403 as const };

  return { ok: true as const, supabase, userId: user.id };
}

function enforceWriteLimit(request: Request, userId: string) {
  const limit = rateLimit(`admin-club-write:${userId}:${requestIp(request)}`, 20, 60 * 60 * 1000);
  if (limit.allowed) return null;
  return NextResponse.json({ error: "Too many club changes. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
}

function textField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function storeLogo(service: ReturnType<typeof createServiceClient>, file: FormDataEntryValue | null, clubId: string) {
  if (!(file instanceof File) || file.size === 0) return { url: null, path: null, error: null };
  const extension = allowedLogoTypes[file.type];
  if (!extension) return { url: null, path: null, error: "Choose a PNG, JPG, or WebP logo." };
  if (file.size > maxLogoBytes) return { url: null, path: null, error: "The logo must be 5 MB or smaller." };

  const path = `${clubId}/${randomUUID()}.${extension}`;
  const { error } = await service.storage.from(bucket).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null, path: null, error: `Could not upload the logo: ${error.message}` };

  const { data } = service.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const limited = enforceWriteLimit(request, access.userId);
  if (limited) return limited;

  const form = await request.formData();
  const name = textField(form, "name");
  const email = textField(form, "contact_email").toLowerCase();
  const description = textField(form, "description");
  const phone = textField(form, "contact_phone");
  const slug = slugify(name);
  if (!name || !slug) return NextResponse.json({ error: "Enter a club name with at least one letter or number." }, { status: 400 });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid club login and contact email." }, { status: 400 });

  const service = createServiceClient();
  const clubId = randomUUID();
  const logo = await storeLogo(service, form.get("logo"), clubId);
  if (logo.error) return NextResponse.json({ error: logo.error }, { status: 400 });

  const { error: clubError } = await service.from("clubs").insert({
    id: clubId,
    name,
    slug,
    logo_url: logo.url,
    description: description || null,
    contact_email: email,
    contact_phone: phone || null,
  });
  if (clubError) {
    if (logo.path) await service.storage.from(bucket).remove([logo.path]);
    const message = clubError.code === "23505" ? "A club with this name already exists. Choose a distinct name." : clubError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { club_name: name },
  });
  if (authError || !authData.user) {
    await service.from("clubs").delete().eq("id", clubId);
    if (logo.path) await service.storage.from(bucket).remove([logo.path]);
    return NextResponse.json({ error: authError?.message ?? "Could not create the club account." }, { status: 400 });
  }

  const { error: accountError } = await service.from("club_accounts").insert({
    club_id: clubId,
    user_id: authData.user.id,
  });
  if (accountError) {
    await service.auth.admin.deleteUser(authData.user.id);
    await service.from("clubs").delete().eq("id", clubId);
    if (logo.path) await service.storage.from(bucket).remove([logo.path]);
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  return NextResponse.json({
    club: { id: clubId, name, slug, logo_url: logo.url, description: description || null, contact_email: email, contact_phone: phone || null, is_active: true, created_at: new Date().toISOString() },
    credentials: { email, password: temporaryPassword },
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const limited = enforceWriteLimit(request, access.userId);
  if (limited) return limited;

  const contentType = request.headers.get("content-type") ?? "";
  const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
  const body = form ? null : await request.json() as Record<string, unknown>;
  const value = (key: string) => form ? (form.has(key) ? textField(form, key) : undefined) : body?.[key];
  const id = value("id");
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "A club ID is required." }, { status: 400 });

  const service = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (value("is_active") !== undefined) updates.is_active = value("is_active");
  if (value("name") !== undefined) {
    const name = String(value("name")).trim();
    const slug = slugify(name);
    if (!name || !slug) return NextResponse.json({ error: "Enter a valid club name." }, { status: 400 });
    updates.name = name;
    updates.slug = slug;
  }
  if (form) {
    const email = textField(form, "contact_email").toLowerCase();
    const phone = textField(form, "contact_phone");
    updates.description = textField(form, "description") || null;
    updates.contact_email = email || null;
    updates.contact_phone = phone || null;
    const logo = await storeLogo(service, form.get("logo"), id);
    if (logo.error) return NextResponse.json({ error: logo.error }, { status: 400 });
    if (logo.url) updates.logo_url = logo.url;
  }

  if (!Object.keys(updates).length) return NextResponse.json({ error: "There are no changes to save." }, { status: 400 });
  const { data, error } = await service
    .from("clubs")
    .update(updates)
    .eq("id", id)
    .select("id, name, slug, logo_url, description, contact_email, contact_phone, is_active, created_at")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Club not found." }, { status: 400 });
  return NextResponse.json({ club: data });
}
