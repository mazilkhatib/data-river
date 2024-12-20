import { Outlet, useLoaderData } from "@remix-run/react";
import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { createClient } from "~/utils/supabase.server";
import type { Database } from "~/types/supabase";
import { Navbar } from "~/components/layout/navbar";
import { CookieConsent } from "~/components/layout/cookie-consent";

type LoaderData = {
  profile: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "display_name" | "avatar_url" | "username"
  >;
};

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.url.includes("/sign-up")) {
    return;
  }

  const { supabase } = await createClient(request);

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Failed to load profile");
  }

  const username = profile.username;

  if (!username) {
    return redirect("/welcome");
  }

  return json<LoaderData>({ profile });
}

export default function AppLayout() {
  const { profile } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen h-screen flex flex-col bg-background">
      <Navbar profile={profile} />
      <main className="flex-1 h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      <CookieConsent />
    </div>
  );
}
