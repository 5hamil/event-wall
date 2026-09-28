import { createClient } from "@/lib/supabase/server";
import { CategoriesManager, type Category } from "./categories-manager";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, created_at")
    .order("name", { ascending: true });

  return <CategoriesManager categories={(data ?? []) as Category[]} loadError={error?.message ?? null} />;
}
