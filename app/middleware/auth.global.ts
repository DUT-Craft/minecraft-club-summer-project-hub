const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/projects",
  "/projects/groud",
  "/submit",
  "/ideas",
]);

export default defineNuxtRouteMiddleware((to) => {
  const runtimeConfig = useRuntimeConfig();
  const authCheckEnabled = String(runtimeConfig.public.authCheckEnabled ?? "true").toLowerCase();
  if (["false", "0", "no", "off"].includes(authCheckEnabled)) {
    return;
  }

  if (publicRoutes.has(to.path) || to.path.startsWith("/projects/")) {
    return;
  }

  const authToken = useCookie<string | null>("chat_auth_token");
  if (!authToken.value?.trim()) {
    return navigateTo({
      path: "/login",
      query: {
        authError: "unauthorized",
        redirect: to.fullPath,
      },
    });
  }
});
