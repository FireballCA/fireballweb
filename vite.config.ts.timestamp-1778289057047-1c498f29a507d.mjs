// vite.config.ts
import { defineConfig, loadEnv } from "file:///sessions/loving-relaxed-rubin/mnt/fireballweb/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/loving-relaxed-rubin/mnt/fireballweb/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/sessions/loving-relaxed-rubin/mnt/fireballweb";
function shopifyCustomerApiPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), "");
  const shopifyStoreUrl = env.SHOPIFY_STORE_URL || env.VITE_SHOPIFY_STORE_URL || "";
  const shopifyStorefrontToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
  const shopifyStorefrontApiVersion = env.SHOPIFY_STOREFRONT_API_VERSION || env.VITE_SHOPIFY_STOREFRONT_API_VERSION || "2024-10";
  const shopifyAdminApiToken = env.SHOPIFY_ADMIN_API_TOKEN || "";
  const shopifyApiVersion = env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const resendApiKey = env.RESEND_API_KEY || env.RESEND_KEY || "";
  const cleanInline = (value) => String(value || "").replace(/[\r\n]+/g, "").trim();
  const toResendTagToken = (value, fallback = "unknown") => {
    const normalized = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
    return normalized || fallback;
  };
  const extractEmailDomain = (value) => {
    const bracketMatch = value.match(/<([^>]+)>/);
    const emailValue = (bracketMatch ? bracketMatch[1] : value).toLowerCase();
    const atIndex = emailValue.lastIndexOf("@");
    return atIndex === -1 ? "" : emailValue.slice(atIndex + 1);
  };
  const PUBLIC_EMAIL_DOMAINS = /* @__PURE__ */ new Set(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"]);
  const configuredFromEmail = cleanInline(
    env.FIREBALL_FROM_EMAIL || "Fireball Canada <no-reply@fireballcanada.com>"
  );
  const configuredFromDomain = extractEmailDomain(configuredFromEmail);
  const fireballFromEmail = configuredFromDomain && !PUBLIC_EMAIL_DOMAINS.has(configuredFromDomain) ? configuredFromEmail : "Fireball Canada <onboarding@resend.dev>";
  const isInvalidShopifyToken = (details) => {
    const text = typeof details === "string" ? details : (() => {
      try {
        return JSON.stringify(details || {});
      } catch {
        return "";
      }
    })();
    return /invalid api key|access token|wrong password|unrecognized login/i.test(text);
  };
  const isMissingReadOrdersScope = (details) => {
    const text = typeof details === "string" ? details : (() => {
      try {
        return JSON.stringify(details || {});
      } catch {
        return "";
      }
    })();
    return /read_orders scope|requires merchant approval/i.test(text);
  };
  const readJsonBody = async (req) => await new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += String(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
  const fetchShopifyAdminJson = async (url) => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAdminApiToken
      }
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, data };
  };
  return {
    name: "shopify-customer-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/shopify-storefront", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyStorefrontToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_STOREFRONT_ACCESS_TOKEN (server env, not exposed to the client)."
            })
          );
          return;
        }
        try {
          const body = await readJsonBody(req);
          const query = typeof body.query === "string" ? body.query : "";
          if (!query.trim()) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing GraphQL query" }));
            return;
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const endpoint = `${normalizedStoreUrl}/api/${shopifyStorefrontApiVersion}/graphql.json`;
          const sfResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": shopifyStorefrontToken
            },
            body: JSON.stringify({
              query,
              variables: body.variables
            })
          });
          const payload = await sfResponse.json().catch(() => null);
          res.statusCode = sfResponse.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload ?? { errors: [{ message: "Invalid JSON from Shopify" }] }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Shopify Storefront proxy failed",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/shopify-secure-cart", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyStorefrontToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing Shopify Storefront server configuration." }));
          return;
        }
        try {
          const body = await readJsonBody(req);
          const lines = Array.isArray(body.lines) ? body.lines.map((line) => ({
            shopifyVariantId: String(line?.shopifyVariantId || ""),
            quantity: Number(line?.quantity || 0)
          })).filter((line) => line.shopifyVariantId && Number.isFinite(line.quantity) && line.quantity > 0) : [];
          if (!lines.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Cart is empty or invalid" }));
            return;
          }
          let isPartner = false;
          const authHeader = String(req.headers.authorization || "");
          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
          if (token && supabaseUrl && supabaseServiceRoleKey) {
            const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
              method: "GET",
              headers: {
                apikey: supabaseServiceRoleKey,
                Authorization: `Bearer ${token}`
              }
            });
            const userJson = await userRes.json().catch(() => null);
            const uid = typeof userJson?.id === "string" ? userJson.id : "";
            if (uid) {
              const profileRes = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=role,partner_status&limit=1`,
                {
                  method: "GET",
                  headers: {
                    apikey: supabaseServiceRoleKey,
                    Authorization: `Bearer ${supabaseServiceRoleKey}`
                  }
                }
              );
              const profileJson = await profileRes.json().catch(() => []);
              const profile = Array.isArray(profileJson) ? profileJson[0] : null;
              const role = String(profile?.role || "").toLowerCase();
              const partnerStatus = String(profile?.partner_status || "").toLowerCase();
              isPartner = role === "partner" || partnerStatus === "partner";
            }
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const endpoint = `${normalizedStoreUrl}/api/${shopifyStorefrontApiVersion}/graphql.json`;
          const variantQuery = `
            query VariantAccess($id: ID!) {
              node(id: $id) {
                ... on ProductVariant {
                  id
                  product { tags }
                }
              }
            }
          `;
          const restrictedTags = /* @__PURE__ */ new Set(["partner-only", "installer-only", "installer", "partner"]);
          for (const line of lines) {
            const sfResponse = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": shopifyStorefrontToken
              },
              body: JSON.stringify({ query: variantQuery, variables: { id: line.shopifyVariantId } })
            });
            const payload = await sfResponse.json().catch(() => null);
            const tags = Array.isArray(payload?.data?.node?.product?.tags) ? payload.data.node.product.tags : [];
            const isRestricted = tags.some(
              (tag) => restrictedTags.has(String(tag || "").toLowerCase().trim())
            );
            if (isRestricted && !isPartner) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Access denied for restricted product",
                  code: "PARTNER_REQUIRED",
                  redirectTo: "/join-fireball"
                })
              );
              return;
            }
          }
          const encoded = lines.map((line) => {
            const numericId = line.shopifyVariantId.split("/").pop();
            if (!numericId) return null;
            return `${numericId}:${line.quantity}`;
          }).filter(Boolean);
          if (!encoded.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No valid Shopify variants in cart" }));
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              checkoutUrl: `${normalizedStoreUrl.replace(/\/+$/, "")}/cart/${encoded.join(",")}`
            })
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Secure checkout validation failed",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/create-shopify-customer", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env."
            })
          );
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const email = parsed.email?.trim();
            const firstName = parsed.first_name?.trim() || "";
            const lastName = parsed.last_name?.trim() || "";
            if (!email) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing required field: email" }));
              return;
            }
            const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
            const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`;
            const mutation = `
              mutation customerCreate($input: CustomerInput!) {
                customerCreate(input: $input) {
                  customer {
                    id
                    email
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": shopifyAdminApiToken
              },
              body: JSON.stringify({
                query: mutation,
                variables: {
                  input: {
                    email,
                    firstName,
                    lastName
                  }
                }
              })
            });
            const result = await response.json();
            const userErrors = result?.data?.customerCreate?.userErrors || [];
            const isAlreadyExistsError = Array.isArray(userErrors) ? userErrors.some((e) => {
              const msg = String(e?.message || "").toLowerCase();
              return msg.includes("taken") || msg.includes("already exists") || msg.includes("has already been taken");
            }) : false;
            if (!response.ok || result?.errors?.length || userErrors.length && !isAlreadyExistsError) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Failed to create Shopify customer",
                  details: result?.errors || userErrors
                })
              );
              return;
            }
            if (isAlreadyExistsError) {
              const lookupQuery = `
                query customersByEmail($query: String!) {
                  customers(first: 1, query: $query) {
                    edges {
                      node {
                        id
                        email
                      }
                    }
                  }
                }
              `;
              const lookupResponse = await fetch(endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Shopify-Access-Token": shopifyAdminApiToken
                },
                body: JSON.stringify({
                  query: lookupQuery,
                  variables: { query: `email:${email}` }
                })
              });
              const lookupResult = await lookupResponse.json().catch(() => null);
              const existingCustomer = lookupResult?.data?.customers?.edges?.[0]?.node || null;
              if (existingCustomer?.id) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    success: true,
                    customer: existingCustomer,
                    reusedExisting: true
                  })
                );
                return;
              }
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                customer: result?.data?.customerCreate?.customer || null
              })
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
              })
            );
          }
        });
      });
      server.middlewares.use("/api/update-shopify-customer", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env."
            })
          );
          return;
        }
        try {
          const body = await readJsonBody(req);
          const email = (body.email || "").trim();
          const firstName = (body.first_name || "").trim();
          const lastName = (body.last_name || "").trim();
          if (!email) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing required field: email" }));
            return;
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`;
          const lookupQuery = `
            query customersByEmail($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                    email
                  }
                }
              }
            }
          `;
          const lookupResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyAdminApiToken
            },
            body: JSON.stringify({
              query: lookupQuery,
              variables: {
                query: `email:${email}`
              }
            })
          });
          const lookupResult = await lookupResponse.json();
          if (!lookupResponse.ok || lookupResult?.errors?.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Failed to lookup Shopify customer",
                details: lookupResult?.errors || null
              })
            );
            return;
          }
          const edges = lookupResult?.data?.customers?.edges || [];
          if (!Array.isArray(edges) || edges.length === 0 || !edges[0]?.node?.id) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, skipped: "customer_not_found" }));
            return;
          }
          const customerId = edges[0].node.id;
          const updateMutation = `
            mutation customerUpdate($id: ID!, $input: CustomerInput!) {
              customerUpdate(id: $id, input: $input) {
                customer {
                  id
                  email
                  firstName
                  lastName
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          const input = {
            ...firstName ? { firstName } : {},
            ...lastName ? { lastName } : {}
          };
          const updateResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyAdminApiToken
            },
            body: JSON.stringify({
              query: updateMutation,
              variables: {
                id: customerId,
                input
              }
            })
          });
          const updateResult = await updateResponse.json();
          const userErrors = updateResult?.data?.customerUpdate?.userErrors || [];
          if (!updateResponse.ok || updateResult?.errors?.length || userErrors.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Failed to update Shopify customer",
                details: updateResult?.errors || userErrors || null
              })
            );
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: true,
              customer: updateResult?.data?.customerUpdate?.customer || null
            })
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/send-shopify-customer-invite", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env."
            })
          );
          return;
        }
        try {
          const body = await readJsonBody(req);
          const shopifyCustomerId = typeof body.shopifyCustomerId === "string" ? body.shopifyCustomerId.trim() : "";
          if (!shopifyCustomerId || !shopifyCustomerId.startsWith("gid://shopify/Customer/")) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing or invalid shopifyCustomerId" }));
            return;
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`;
          const mutation = `
            mutation customerSendAccountInviteEmail($customerId: ID!) {
              customerSendAccountInviteEmail(customerId: $customerId) {
                customer { id }
                userErrors { field message }
              }
            }
          `;
          const inviteResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyAdminApiToken
            },
            body: JSON.stringify({
              query: mutation,
              variables: { customerId: shopifyCustomerId }
            })
          });
          const inviteResult = await inviteResponse.json();
          const userErrors = inviteResult?.data?.customerSendAccountInviteEmail?.userErrors || [];
          const errors = inviteResult?.errors || [];
          if (!inviteResponse.ok || errors.length || userErrors.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Failed to send Shopify account invite email",
                details: errors.length ? errors : userErrors
              })
            );
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, message: "Invite email sent" }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/shopify-order-preview", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env."
            })
          );
          return;
        }
        try {
          const body = await readJsonBody(req);
          const orderIds = Array.isArray(body.orderIds) ? body.orderIds.map((id) => String(id || "").trim()).filter(Boolean).slice(0, 10) : [];
          if (!orderIds.length) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, previews: {} }));
            return;
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const previews = {};
          for (const orderId of orderIds) {
            try {
              const orderUrl = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/orders/${encodeURIComponent(
                orderId
              )}.json?status=any&fields=id,name,currency,line_items`;
              const orderRes = await fetchShopifyAdminJson(orderUrl);
              const order = orderRes?.data?.order || null;
              if (!order) continue;
              const firstItem = Array.isArray(order.line_items) && order.line_items.length > 0 ? order.line_items[0] : null;
              let imageUrl = firstItem?.image?.src || firstItem?.image?.url || firstItem?.featured_image?.src || firstItem?.featured_image?.url || null;
              if (!imageUrl && firstItem?.product_id) {
                const productUrl = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/products/${encodeURIComponent(
                  String(firstItem.product_id)
                )}.json?fields=id,image,images,title`;
                const productRes = await fetchShopifyAdminJson(productUrl);
                const product = productRes?.data?.product || null;
                imageUrl = product?.image?.src || (Array.isArray(product?.images) ? product.images[0]?.src : null) || null;
              }
              previews[orderId] = {
                orderName: typeof order.name === "string" ? order.name : null,
                currency: typeof order.currency === "string" ? order.currency : null,
                productTitle: typeof firstItem?.title === "string" ? firstItem.title : typeof firstItem?.name === "string" ? firstItem.name : null,
                imageUrl: typeof imageUrl === "string" ? imageUrl : null
              };
            } catch {
            }
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, previews }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/shopify-track-order", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env."
            })
          );
          return;
        }
        try {
          const body = await readJsonBody(req);
          const rawOrderNumber = String(body.orderNumber || "").trim();
          const orderNumber = rawOrderNumber ? rawOrderNumber.startsWith("#") ? rawOrderNumber : `#${rawOrderNumber}` : "";
          const email = String(body.email || "").trim().toLowerCase();
          if (!orderNumber || !email) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing required fields: orderNumber and email" }));
            return;
          }
          const normalizedStoreUrl = shopifyStoreUrl.startsWith("http") ? shopifyStoreUrl : `https://${shopifyStoreUrl}`;
          const ordersUrl = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/orders.json?status=any&name=${encodeURIComponent(
            orderNumber
          )}&fields=id,name,order_number,email,created_at,financial_status,fulfillment_status,fulfillments,total_price,currency,line_items`;
          const orderRes = await fetchShopifyAdminJson(ordersUrl);
          if (!orderRes.ok) {
            if (isInvalidShopifyToken(orderRes.data)) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Shopify Admin token is invalid. Update SHOPIFY_ADMIN_API_TOKEN in server environment."
                })
              );
              return;
            }
            if (isMissingReadOrdersScope(orderRes.data)) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Shopify API access is missing read_orders permission. Approve and reinstall your app scopes in Shopify admin."
                })
              );
              return;
            }
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Shopify request failed",
                details: orderRes.data || null
              })
            );
            return;
          }
          const orders = Array.isArray(orderRes.data?.orders) ? orderRes.data.orders : [];
          const order = orders.find((candidate) => {
            const candidateEmail = String(candidate?.email || "").trim().toLowerCase();
            return candidateEmail === email;
          });
          if (!order) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Order not found for provided email and order number" }));
            return;
          }
          const firstLineItem = Array.isArray(order.line_items) && order.line_items.length > 0 ? order.line_items[0] : null;
          const fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments : [];
          const tracking = fulfillments.flatMap((fulfillment) => {
            const company = String(fulfillment?.tracking_company || "").trim() || null;
            const status = String(fulfillment?.shipment_status || "").trim() || null;
            if (Array.isArray(fulfillment?.tracking_numbers) && fulfillment.tracking_numbers.length) {
              return fulfillment.tracking_numbers.map((trackingNumber, index) => ({
                number: String(trackingNumber || "").trim() || null,
                url: Array.isArray(fulfillment?.tracking_urls) && fulfillment.tracking_urls[index] ? String(fulfillment.tracking_urls[index]).trim() : null,
                company,
                status
              }));
            }
            const singleNumber = String(fulfillment?.tracking_number || "").trim() || null;
            const singleUrl = String(fulfillment?.tracking_url || "").trim() || null;
            if (!singleNumber && !singleUrl) return [];
            return [{ number: singleNumber, url: singleUrl, company, status }];
          });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: true,
              order: {
                id: order.id,
                name: order.name,
                orderNumber: order.order_number,
                email: order.email,
                createdAt: order.created_at,
                financialStatus: order.financial_status,
                fulfillmentStatus: order.fulfillment_status,
                totalPrice: Number.parseFloat(order.total_price || "0"),
                currency: order.currency || "CAD",
                firstItemTitle: firstLineItem?.title || null
              },
              tracking
            })
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
      server.middlewares.use("/api/send-partner-approval-email", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (!resendApiKey) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Missing RESEND_API_KEY in local server env."
            })
          );
          return;
        }
        try {
          const payload = await readJsonBody(req);
          const to = cleanInline(payload.to || "");
          const subject = String(payload.subject || "").trim();
          const message = String(payload.message || "").trim();
          const html = String(payload.html || "").trim();
          const companyName = String(payload.companyName || "").trim();
          const flowTag = String(payload.flowTag || "partner_approval").trim() || "partner_approval";
          const safeFlowTag = toResendTagToken(flowTag, "partner_flow");
          const safeCompanyTag = toResendTagToken(companyName, "unknown");
          if (!to || !subject || !message) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing required fields: to, subject, message" }));
            return;
          }
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fireballFromEmail,
              to: [to],
              subject,
              text: message,
              html: html || void 0,
              tags: [
                { name: "flow", value: safeFlowTag },
                { name: "company", value: safeCompanyTag }
              ]
            })
          });
          const data = await resendResponse.json().catch(() => ({}));
          if (!resendResponse.ok) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Resend rejected the email request.",
                details: data
              })
            );
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: true,
              provider: "resend",
              id: data?.id || null
            })
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          );
        }
      });
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => ({
  /** Tailwind v4 est appliqué via postcss.config.js + @tailwindcss/postcss (pas @tailwindcss/vite, évite conflit @layer). */
  plugins: [react(), shopifyCustomerApiPlugin(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      /** Deux entrées distinctes vers des .ts : un seul fichier .ts pour tout le préfixe faisait résoudre …/index.js sous ce chemin (ENOENT). */
      "use-sync-external-store/shim/index.js": path.resolve(
        __vite_injected_original_dirname,
        "src/shims/use-sync-external-store-shim/index.ts"
      ),
      "use-sync-external-store/shim/with-selector.js": path.resolve(
        __vite_injected_original_dirname,
        "src/shims/use-sync-external-store-shim/with-selector.ts"
      )
    }
  },
  optimizeDeps: {
    exclude: ["lenis"],
    include: [
      "three",
      "three-globe",
      "@react-three/fiber",
      "@react-three/drei",
      "react-router-dom",
      /** CJS → ESM : évite erreurs d’export sur useSyncExternalStore (react-aria / HeroUI). */
      "use-sync-external-store/shim",
      "use-sync-external-store"
    ]
  },
  server: {
    watch: {
      usePolling: true,
      interval: 150
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvbG92aW5nLXJlbGF4ZWQtcnViaW4vbW50L2ZpcmViYWxsd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvbG92aW5nLXJlbGF4ZWQtcnViaW4vbW50L2ZpcmViYWxsd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9sb3ZpbmctcmVsYXhlZC1ydWJpbi9tbnQvZmlyZWJhbGx3ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIHR5cGUgUGx1Z2luIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbmZ1bmN0aW9uIHNob3BpZnlDdXN0b21lckFwaVBsdWdpbihtb2RlOiBzdHJpbmcpOiBQbHVnaW4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKVxuICBjb25zdCBzaG9waWZ5U3RvcmVVcmwgPSBlbnYuU0hPUElGWV9TVE9SRV9VUkwgfHwgZW52LlZJVEVfU0hPUElGWV9TVE9SRV9VUkwgfHwgJydcbiAgY29uc3Qgc2hvcGlmeVN0b3JlZnJvbnRUb2tlbiA9XG4gICAgZW52LlNIT1BJRllfU1RPUkVGUk9OVF9BQ0NFU1NfVE9LRU4gfHwgZW52LlZJVEVfU0hPUElGWV9TVE9SRUZST05UX0FDQ0VTU19UT0tFTiB8fCAnJ1xuICBjb25zdCBzaG9waWZ5U3RvcmVmcm9udEFwaVZlcnNpb24gPVxuICAgIGVudi5TSE9QSUZZX1NUT1JFRlJPTlRfQVBJX1ZFUlNJT04gfHwgZW52LlZJVEVfU0hPUElGWV9TVE9SRUZST05UX0FQSV9WRVJTSU9OIHx8ICcyMDI0LTEwJ1xuICBjb25zdCBzaG9waWZ5QWRtaW5BcGlUb2tlbiA9IGVudi5TSE9QSUZZX0FETUlOX0FQSV9UT0tFTiB8fCAnJ1xuICBjb25zdCBzaG9waWZ5QXBpVmVyc2lvbiA9IGVudi5TSE9QSUZZX0FETUlOX0FQSV9WRVJTSU9OIHx8ICcyMDI0LTEwJ1xuICBjb25zdCBzdXBhYmFzZVVybCA9IGVudi5TVVBBQkFTRV9VUkwgfHwgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8ICcnXG4gIGNvbnN0IHN1cGFiYXNlU2VydmljZVJvbGVLZXkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSB8fCAnJ1xuICBjb25zdCByZXNlbmRBcGlLZXkgPSBlbnYuUkVTRU5EX0FQSV9LRVkgfHwgZW52LlJFU0VORF9LRVkgfHwgJydcbiAgY29uc3QgY2xlYW5JbmxpbmUgPSAodmFsdWU6IHVua25vd24pOiBzdHJpbmcgPT4gU3RyaW5nKHZhbHVlIHx8ICcnKS5yZXBsYWNlKC9bXFxyXFxuXSsvZywgJycpLnRyaW0oKVxuICBjb25zdCB0b1Jlc2VuZFRhZ1Rva2VuID0gKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjayA9ICd1bmtub3duJyk6IHN0cmluZyA9PiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IFN0cmluZyh2YWx1ZSB8fCAnJylcbiAgICAgIC5ub3JtYWxpemUoJ05GRCcpXG4gICAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgJycpXG4gICAgICAucmVwbGFjZSgvW15BLVphLXowLTlfLV0rL2csICdfJylcbiAgICAgIC5yZXBsYWNlKC9eXyt8XyskL2csICcnKVxuICAgIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrXG4gIH1cbiAgY29uc3QgZXh0cmFjdEVtYWlsRG9tYWluID0gKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGJyYWNrZXRNYXRjaCA9IHZhbHVlLm1hdGNoKC88KFtePl0rKT4vKVxuICAgIGNvbnN0IGVtYWlsVmFsdWUgPSAoYnJhY2tldE1hdGNoID8gYnJhY2tldE1hdGNoWzFdIDogdmFsdWUpLnRvTG93ZXJDYXNlKClcbiAgICBjb25zdCBhdEluZGV4ID0gZW1haWxWYWx1ZS5sYXN0SW5kZXhPZignQCcpXG4gICAgcmV0dXJuIGF0SW5kZXggPT09IC0xID8gJycgOiBlbWFpbFZhbHVlLnNsaWNlKGF0SW5kZXggKyAxKVxuICB9XG4gIGNvbnN0IFBVQkxJQ19FTUFJTF9ET01BSU5TID0gbmV3IFNldChbJ2dtYWlsLmNvbScsICdvdXRsb29rLmNvbScsICdob3RtYWlsLmNvbScsICd5YWhvby5jb20nLCAnaWNsb3VkLmNvbSddKVxuICBjb25zdCBjb25maWd1cmVkRnJvbUVtYWlsID0gY2xlYW5JbmxpbmUoXG4gICAgZW52LkZJUkVCQUxMX0ZST01fRU1BSUwgfHwgJ0ZpcmViYWxsIENhbmFkYSA8bm8tcmVwbHlAZmlyZWJhbGxjYW5hZGEuY29tPicsXG4gIClcbiAgY29uc3QgY29uZmlndXJlZEZyb21Eb21haW4gPSBleHRyYWN0RW1haWxEb21haW4oY29uZmlndXJlZEZyb21FbWFpbClcbiAgY29uc3QgZmlyZWJhbGxGcm9tRW1haWwgPVxuICAgIGNvbmZpZ3VyZWRGcm9tRG9tYWluICYmICFQVUJMSUNfRU1BSUxfRE9NQUlOUy5oYXMoY29uZmlndXJlZEZyb21Eb21haW4pXG4gICAgICA/IGNvbmZpZ3VyZWRGcm9tRW1haWxcbiAgICAgIDogJ0ZpcmViYWxsIENhbmFkYSA8b25ib2FyZGluZ0ByZXNlbmQuZGV2PidcbiAgY29uc3QgaXNJbnZhbGlkU2hvcGlmeVRva2VuID0gKGRldGFpbHM6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgICBjb25zdCB0ZXh0ID1cbiAgICAgIHR5cGVvZiBkZXRhaWxzID09PSAnc3RyaW5nJ1xuICAgICAgICA/IGRldGFpbHNcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGRldGFpbHMgfHwge30pXG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgcmV0dXJuICcnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKVxuICAgIHJldHVybiAvaW52YWxpZCBhcGkga2V5fGFjY2VzcyB0b2tlbnx3cm9uZyBwYXNzd29yZHx1bnJlY29nbml6ZWQgbG9naW4vaS50ZXN0KHRleHQpXG4gIH1cbiAgY29uc3QgaXNNaXNzaW5nUmVhZE9yZGVyc1Njb3BlID0gKGRldGFpbHM6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgICBjb25zdCB0ZXh0ID1cbiAgICAgIHR5cGVvZiBkZXRhaWxzID09PSAnc3RyaW5nJ1xuICAgICAgICA/IGRldGFpbHNcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGRldGFpbHMgfHwge30pXG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgcmV0dXJuICcnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKVxuICAgIHJldHVybiAvcmVhZF9vcmRlcnMgc2NvcGV8cmVxdWlyZXMgbWVyY2hhbnQgYXBwcm92YWwvaS50ZXN0KHRleHQpXG4gIH1cblxuICBjb25zdCByZWFkSnNvbkJvZHkgPSBhc3luYyAocmVxOiBhbnkpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiA9PlxuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBsZXQgYm9keSA9ICcnXG4gICAgICByZXEub24oJ2RhdGEnLCAoY2h1bms6IEJ1ZmZlciB8IHN0cmluZykgPT4ge1xuICAgICAgICBib2R5ICs9IFN0cmluZyhjaHVuaylcbiAgICAgIH0pXG4gICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UoYm9keSB8fCAne30nKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgcmVzb2x2ZSh7fSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG4gIGNvbnN0IGZldGNoU2hvcGlmeUFkbWluSnNvbiA9IGFzeW5jICh1cmw6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnWC1TaG9waWZ5LUFjY2Vzcy1Ub2tlbic6IHNob3BpZnlBZG1pbkFwaVRva2VuLFxuICAgICAgfSxcbiAgICB9KVxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+IG51bGwpKSBhcyBhbnlcbiAgICByZXR1cm4geyBvazogcmVzcG9uc2Uub2ssIGRhdGEgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc2hvcGlmeS1jdXN0b21lci1hcGktZGV2JyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3Nob3BpZnktc3RvcmVmcm9udCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2hvcGlmeVN0b3JlVXJsIHx8ICFzaG9waWZ5U3RvcmVmcm9udFRva2VuKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgJ01pc3NpbmcgU0hPUElGWV9TVE9SRV9VUkwgb3IgU0hPUElGWV9TVE9SRUZST05UX0FDQ0VTU19UT0tFTiAoc2VydmVyIGVudiwgbm90IGV4cG9zZWQgdG8gdGhlIGNsaWVudCkuJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IChhd2FpdCByZWFkSnNvbkJvZHkocmVxKSkgYXMgeyBxdWVyeT86IHVua25vd247IHZhcmlhYmxlcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH1cbiAgICAgICAgICBjb25zdCBxdWVyeSA9IHR5cGVvZiBib2R5LnF1ZXJ5ID09PSAnc3RyaW5nJyA/IGJvZHkucXVlcnkgOiAnJ1xuICAgICAgICAgIGlmICghcXVlcnkudHJpbSgpKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBHcmFwaFFMIHF1ZXJ5JyB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTdG9yZVVybCA9IHNob3BpZnlTdG9yZVVybC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgID8gc2hvcGlmeVN0b3JlVXJsXG4gICAgICAgICAgICA6IGBodHRwczovLyR7c2hvcGlmeVN0b3JlVXJsfWBcbiAgICAgICAgICBjb25zdCBlbmRwb2ludCA9IGAke25vcm1hbGl6ZWRTdG9yZVVybH0vYXBpLyR7c2hvcGlmeVN0b3JlZnJvbnRBcGlWZXJzaW9ufS9ncmFwaHFsLmpzb25gXG5cbiAgICAgICAgICBjb25zdCBzZlJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW5kcG9pbnQsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAnWC1TaG9waWZ5LVN0b3JlZnJvbnQtQWNjZXNzLVRva2VuJzogc2hvcGlmeVN0b3JlZnJvbnRUb2tlbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgICB2YXJpYWJsZXM6IGJvZHkudmFyaWFibGVzLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSAoYXdhaXQgc2ZSZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIHVua25vd25cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHNmUmVzcG9uc2Uuc3RhdHVzXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCA/PyB7IGVycm9yczogW3sgbWVzc2FnZTogJ0ludmFsaWQgSlNPTiBmcm9tIFNob3BpZnknIH1dIH0pKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnU2hvcGlmeSBTdG9yZWZyb250IHByb3h5IGZhaWxlZCcsXG4gICAgICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3Nob3BpZnktc2VjdXJlLWNhcnQnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNob3BpZnlTdG9yZVVybCB8fCAhc2hvcGlmeVN0b3JlZnJvbnRUb2tlbikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3NpbmcgU2hvcGlmeSBTdG9yZWZyb250IHNlcnZlciBjb25maWd1cmF0aW9uLicgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSkpIGFzIHsgbGluZXM/OiBBcnJheTx7IHNob3BpZnlWYXJpYW50SWQ/OiBzdHJpbmc7IHF1YW50aXR5PzogbnVtYmVyIH0+IH1cbiAgICAgICAgICBjb25zdCBsaW5lcyA9IEFycmF5LmlzQXJyYXkoYm9keS5saW5lcylcbiAgICAgICAgICAgID8gYm9keS5saW5lc1xuICAgICAgICAgICAgICAgIC5tYXAoKGxpbmUpID0+ICh7XG4gICAgICAgICAgICAgICAgICBzaG9waWZ5VmFyaWFudElkOiBTdHJpbmcobGluZT8uc2hvcGlmeVZhcmlhbnRJZCB8fCAnJyksXG4gICAgICAgICAgICAgICAgICBxdWFudGl0eTogTnVtYmVyKGxpbmU/LnF1YW50aXR5IHx8IDApLFxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUuc2hvcGlmeVZhcmlhbnRJZCAmJiBOdW1iZXIuaXNGaW5pdGUobGluZS5xdWFudGl0eSkgJiYgbGluZS5xdWFudGl0eSA+IDApXG4gICAgICAgICAgICA6IFtdXG5cbiAgICAgICAgICBpZiAoIWxpbmVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0NhcnQgaXMgZW1wdHkgb3IgaW52YWxpZCcgfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgaXNQYXJ0bmVyID0gZmFsc2VcbiAgICAgICAgICBjb25zdCBhdXRoSGVhZGVyID0gU3RyaW5nKHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24gfHwgJycpXG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSA/IGF1dGhIZWFkZXIuc2xpY2UoNykudHJpbSgpIDogJydcbiAgICAgICAgICBpZiAodG9rZW4gJiYgc3VwYWJhc2VVcmwgJiYgc3VwYWJhc2VTZXJ2aWNlUm9sZUtleSkge1xuICAgICAgICAgICAgY29uc3QgdXNlclJlcyA9IGF3YWl0IGZldGNoKGAke3N1cGFiYXNlVXJsfS9hdXRoL3YxL3VzZXJgLCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBhcGlrZXk6IHN1cGFiYXNlU2VydmljZVJvbGVLZXksXG4gICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgY29uc3QgdXNlckpzb24gPSAoYXdhaXQgdXNlclJlcy5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIGFueVxuICAgICAgICAgICAgY29uc3QgdWlkID0gdHlwZW9mIHVzZXJKc29uPy5pZCA9PT0gJ3N0cmluZycgPyB1c2VySnNvbi5pZCA6ICcnXG4gICAgICAgICAgICBpZiAodWlkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHByb2ZpbGVSZXMgPSBhd2FpdCBmZXRjaChcbiAgICAgICAgICAgICAgICBgJHtzdXBhYmFzZVVybH0vcmVzdC92MS9wcm9maWxlcz9pZD1lcS4ke2VuY29kZVVSSUNvbXBvbmVudCh1aWQpfSZzZWxlY3Q9cm9sZSxwYXJ0bmVyX3N0YXR1cyZsaW1pdD0xYCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBhcGlrZXk6IHN1cGFiYXNlU2VydmljZVJvbGVLZXksXG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtzdXBhYmFzZVNlcnZpY2VSb2xlS2V5fWAsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgY29uc3QgcHJvZmlsZUpzb24gPSAoYXdhaXQgcHJvZmlsZVJlcy5qc29uKCkuY2F0Y2goKCkgPT4gW10pKSBhcyBhbnlbXVxuICAgICAgICAgICAgICBjb25zdCBwcm9maWxlID0gQXJyYXkuaXNBcnJheShwcm9maWxlSnNvbikgPyBwcm9maWxlSnNvblswXSA6IG51bGxcbiAgICAgICAgICAgICAgY29uc3Qgcm9sZSA9IFN0cmluZyhwcm9maWxlPy5yb2xlIHx8ICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgIGNvbnN0IHBhcnRuZXJTdGF0dXMgPSBTdHJpbmcocHJvZmlsZT8ucGFydG5lcl9zdGF0dXMgfHwgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgaXNQYXJ0bmVyID0gcm9sZSA9PT0gJ3BhcnRuZXInIHx8IHBhcnRuZXJTdGF0dXMgPT09ICdwYXJ0bmVyJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTdG9yZVVybCA9IHNob3BpZnlTdG9yZVVybC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgID8gc2hvcGlmeVN0b3JlVXJsXG4gICAgICAgICAgICA6IGBodHRwczovLyR7c2hvcGlmeVN0b3JlVXJsfWBcbiAgICAgICAgICBjb25zdCBlbmRwb2ludCA9IGAke25vcm1hbGl6ZWRTdG9yZVVybH0vYXBpLyR7c2hvcGlmeVN0b3JlZnJvbnRBcGlWZXJzaW9ufS9ncmFwaHFsLmpzb25gXG4gICAgICAgICAgY29uc3QgdmFyaWFudFF1ZXJ5ID0gYFxuICAgICAgICAgICAgcXVlcnkgVmFyaWFudEFjY2VzcygkaWQ6IElEISkge1xuICAgICAgICAgICAgICBub2RlKGlkOiAkaWQpIHtcbiAgICAgICAgICAgICAgICAuLi4gb24gUHJvZHVjdFZhcmlhbnQge1xuICAgICAgICAgICAgICAgICAgaWRcbiAgICAgICAgICAgICAgICAgIHByb2R1Y3QgeyB0YWdzIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBgXG4gICAgICAgICAgY29uc3QgcmVzdHJpY3RlZFRhZ3MgPSBuZXcgU2V0KFsncGFydG5lci1vbmx5JywgJ2luc3RhbGxlci1vbmx5JywgJ2luc3RhbGxlcicsICdwYXJ0bmVyJ10pXG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHNmUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ1gtU2hvcGlmeS1TdG9yZWZyb250LUFjY2Vzcy1Ub2tlbic6IHNob3BpZnlTdG9yZWZyb250VG9rZW4sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcXVlcnk6IHZhcmlhbnRRdWVyeSwgdmFyaWFibGVzOiB7IGlkOiBsaW5lLnNob3BpZnlWYXJpYW50SWQgfSB9KSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gKGF3YWl0IHNmUmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+IG51bGwpKSBhcyBhbnlcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBBcnJheS5pc0FycmF5KHBheWxvYWQ/LmRhdGE/Lm5vZGU/LnByb2R1Y3Q/LnRhZ3MpID8gcGF5bG9hZC5kYXRhLm5vZGUucHJvZHVjdC50YWdzIDogW11cbiAgICAgICAgICAgIGNvbnN0IGlzUmVzdHJpY3RlZCA9IHRhZ3Muc29tZSgodGFnOiB1bmtub3duKSA9PlxuICAgICAgICAgICAgICByZXN0cmljdGVkVGFncy5oYXMoU3RyaW5nKHRhZyB8fCAnJykudG9Mb3dlckNhc2UoKS50cmltKCkpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZCAmJiAhaXNQYXJ0bmVyKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAzXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogJ0FjY2VzcyBkZW5pZWQgZm9yIHJlc3RyaWN0ZWQgcHJvZHVjdCcsXG4gICAgICAgICAgICAgICAgICBjb2RlOiAnUEFSVE5FUl9SRVFVSVJFRCcsXG4gICAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnL2pvaW4tZmlyZWJhbGwnLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGVuY29kZWQgPSBsaW5lc1xuICAgICAgICAgICAgLm1hcCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBudW1lcmljSWQgPSBsaW5lLnNob3BpZnlWYXJpYW50SWQuc3BsaXQoJy8nKS5wb3AoKVxuICAgICAgICAgICAgICBpZiAoIW51bWVyaWNJZCkgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgcmV0dXJuIGAke251bWVyaWNJZH06JHtsaW5lLnF1YW50aXR5fWBcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG5cbiAgICAgICAgICBpZiAoIWVuY29kZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTm8gdmFsaWQgU2hvcGlmeSB2YXJpYW50cyBpbiBjYXJ0JyB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGNoZWNrb3V0VXJsOiBgJHtub3JtYWxpemVkU3RvcmVVcmwucmVwbGFjZSgvXFwvKyQvLCAnJyl9L2NhcnQvJHtlbmNvZGVkLmpvaW4oJywnKX1gLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnU2VjdXJlIGNoZWNrb3V0IHZhbGlkYXRpb24gZmFpbGVkJyxcbiAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvY3JlYXRlLXNob3BpZnktY3VzdG9tZXInLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNob3BpZnlTdG9yZVVybCB8fCAhc2hvcGlmeUFkbWluQXBpVG9rZW4pIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBlcnJvcjpcbiAgICAgICAgICAgICAgICAnTWlzc2luZyBTSE9QSUZZX1NUT1JFX1VSTCBvciBTSE9QSUZZX0FETUlOX0FQSV9UT0tFTiBpbiBzZXJ2ZXIgZW52LicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYm9keSA9ICcnXG4gICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgICAgICAgIGJvZHkgKz0gY2h1bmtcbiAgICAgICAgfSlcblxuICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpIGFzIHtcbiAgICAgICAgICAgICAgZW1haWw/OiBzdHJpbmdcbiAgICAgICAgICAgICAgZmlyc3RfbmFtZT86IHN0cmluZ1xuICAgICAgICAgICAgICBsYXN0X25hbWU/OiBzdHJpbmdcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZW1haWwgPSBwYXJzZWQuZW1haWw/LnRyaW0oKVxuICAgICAgICAgICAgY29uc3QgZmlyc3ROYW1lID0gcGFyc2VkLmZpcnN0X25hbWU/LnRyaW0oKSB8fCAnJ1xuICAgICAgICAgICAgY29uc3QgbGFzdE5hbWUgPSBwYXJzZWQubGFzdF9uYW1lPy50cmltKCkgfHwgJydcblxuICAgICAgICAgICAgaWYgKCFlbWFpbCkge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGQ6IGVtYWlsJyB9KSlcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTdG9yZVVybCA9IHNob3BpZnlTdG9yZVVybC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgICAgPyBzaG9waWZ5U3RvcmVVcmxcbiAgICAgICAgICAgICAgOiBgaHR0cHM6Ly8ke3Nob3BpZnlTdG9yZVVybH1gXG4gICAgICAgICAgICBjb25zdCBlbmRwb2ludCA9IGAke25vcm1hbGl6ZWRTdG9yZVVybH0vYWRtaW4vYXBpLyR7c2hvcGlmeUFwaVZlcnNpb259L2dyYXBocWwuanNvbmBcblxuICAgICAgICAgICAgY29uc3QgbXV0YXRpb24gPSBgXG4gICAgICAgICAgICAgIG11dGF0aW9uIGN1c3RvbWVyQ3JlYXRlKCRpbnB1dDogQ3VzdG9tZXJJbnB1dCEpIHtcbiAgICAgICAgICAgICAgICBjdXN0b21lckNyZWF0ZShpbnB1dDogJGlucHV0KSB7XG4gICAgICAgICAgICAgICAgICBjdXN0b21lciB7XG4gICAgICAgICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB1c2VyRXJyb3JzIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgYFxuXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGVuZHBvaW50LCB7XG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnWC1TaG9waWZ5LUFjY2Vzcy1Ub2tlbic6IHNob3BpZnlBZG1pbkFwaVRva2VuLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgcXVlcnk6IG11dGF0aW9uLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgaW5wdXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5hbWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgICAgICAgICBjb25zdCB1c2VyRXJyb3JzID0gcmVzdWx0Py5kYXRhPy5jdXN0b21lckNyZWF0ZT8udXNlckVycm9ycyB8fCBbXVxuICAgICAgICAgICAgY29uc3QgaXNBbHJlYWR5RXhpc3RzRXJyb3IgPSBBcnJheS5pc0FycmF5KHVzZXJFcnJvcnMpXG4gICAgICAgICAgICAgID8gdXNlckVycm9ycy5zb21lKChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IFN0cmluZyhlPy5tZXNzYWdlIHx8ICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbXNnLmluY2x1ZGVzKCd0YWtlbicpIHx8IG1zZy5pbmNsdWRlcygnYWxyZWFkeSBleGlzdHMnKSB8fCBtc2cuaW5jbHVkZXMoJ2hhcyBhbHJlYWR5IGJlZW4gdGFrZW4nKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIDogZmFsc2VcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vayB8fCByZXN1bHQ/LmVycm9ycz8ubGVuZ3RoIHx8ICh1c2VyRXJyb3JzLmxlbmd0aCAmJiAhaXNBbHJlYWR5RXhpc3RzRXJyb3IpKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgU2hvcGlmeSBjdXN0b21lcicsXG4gICAgICAgICAgICAgICAgICBkZXRhaWxzOiByZXN1bHQ/LmVycm9ycyB8fCB1c2VyRXJyb3JzLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDYXMgZnJcdTAwRTlxdWVudDogZW1haWwgZFx1MDBFOWpcdTAwRTAgZXhpc3RhbnQgY1x1MDBGNHRcdTAwRTkgU2hvcGlmeS5cbiAgICAgICAgICAgIC8vIE9uIHJldG91cm5lIHN1Y2Nlc3M9dHJ1ZSBhdmVjIGxlIGN1c3RvbWVyIGV4aXN0YW50IHBvdXIgXHUwMEU5dml0ZXIgdW4gNDAwIGludXRpbGUgY1x1MDBGNHRcdTAwRTkgZnJvbnQuXG4gICAgICAgICAgICBpZiAoaXNBbHJlYWR5RXhpc3RzRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc3QgbG9va3VwUXVlcnkgPSBgXG4gICAgICAgICAgICAgICAgcXVlcnkgY3VzdG9tZXJzQnlFbWFpbCgkcXVlcnk6IFN0cmluZyEpIHtcbiAgICAgICAgICAgICAgICAgIGN1c3RvbWVycyhmaXJzdDogMSwgcXVlcnk6ICRxdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICBlZGdlcyB7XG4gICAgICAgICAgICAgICAgICAgICAgbm9kZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWxcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgY29uc3QgbG9va3VwUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAnWC1TaG9waWZ5LUFjY2Vzcy1Ub2tlbic6IHNob3BpZnlBZG1pbkFwaVRva2VuLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgcXVlcnk6IGxvb2t1cFF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7IHF1ZXJ5OiBgZW1haWw6JHtlbWFpbH1gIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIGNvbnN0IGxvb2t1cFJlc3VsdCA9IChhd2FpdCBsb29rdXBSZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIGFueVxuICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ0N1c3RvbWVyID0gbG9va3VwUmVzdWx0Py5kYXRhPy5jdXN0b21lcnM/LmVkZ2VzPy5bMF0/Lm5vZGUgfHwgbnVsbFxuICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdDdXN0b21lcj8uaWQpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjdXN0b21lcjogZXhpc3RpbmdDdXN0b21lcixcbiAgICAgICAgICAgICAgICAgICAgcmV1c2VkRXhpc3Rpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1c3RvbWVyOiByZXN1bHQ/LmRhdGE/LmN1c3RvbWVyQ3JlYXRlPy5jdXN0b21lciB8fCBudWxsLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvdXBkYXRlLXNob3BpZnktY3VzdG9tZXInLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNob3BpZnlTdG9yZVVybCB8fCAhc2hvcGlmeUFkbWluQXBpVG9rZW4pIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBlcnJvcjogJ01pc3NpbmcgU0hPUElGWV9TVE9SRV9VUkwgb3IgU0hPUElGWV9BRE1JTl9BUElfVE9LRU4gaW4gc2VydmVyIGVudi4nLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRKc29uQm9keShyZXEpKSBhcyB7XG4gICAgICAgICAgICBlbWFpbD86IHN0cmluZ1xuICAgICAgICAgICAgZmlyc3RfbmFtZT86IHN0cmluZ1xuICAgICAgICAgICAgbGFzdF9uYW1lPzogc3RyaW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZW1haWwgPSAoYm9keS5lbWFpbCB8fCAnJykudHJpbSgpXG4gICAgICAgICAgY29uc3QgZmlyc3ROYW1lID0gKGJvZHkuZmlyc3RfbmFtZSB8fCAnJykudHJpbSgpXG4gICAgICAgICAgY29uc3QgbGFzdE5hbWUgPSAoYm9keS5sYXN0X25hbWUgfHwgJycpLnRyaW0oKVxuXG4gICAgICAgICAgaWYgKCFlbWFpbCkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGQ6IGVtYWlsJyB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTdG9yZVVybCA9IHNob3BpZnlTdG9yZVVybC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgID8gc2hvcGlmeVN0b3JlVXJsXG4gICAgICAgICAgICA6IGBodHRwczovLyR7c2hvcGlmeVN0b3JlVXJsfWBcbiAgICAgICAgICBjb25zdCBlbmRwb2ludCA9IGAke25vcm1hbGl6ZWRTdG9yZVVybH0vYWRtaW4vYXBpLyR7c2hvcGlmeUFwaVZlcnNpb259L2dyYXBocWwuanNvbmBcblxuICAgICAgICAgIGNvbnN0IGxvb2t1cFF1ZXJ5ID0gYFxuICAgICAgICAgICAgcXVlcnkgY3VzdG9tZXJzQnlFbWFpbCgkcXVlcnk6IFN0cmluZyEpIHtcbiAgICAgICAgICAgICAgY3VzdG9tZXJzKGZpcnN0OiAxLCBxdWVyeTogJHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgZWRnZXMge1xuICAgICAgICAgICAgICAgICAgbm9kZSB7XG4gICAgICAgICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYFxuXG4gICAgICAgICAgY29uc3QgbG9va3VwUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdYLVNob3BpZnktQWNjZXNzLVRva2VuJzogc2hvcGlmeUFkbWluQXBpVG9rZW4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBxdWVyeTogbG9va3VwUXVlcnksXG4gICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBgZW1haWw6JHtlbWFpbH1gLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGxvb2t1cFJlc3VsdCA9IChhd2FpdCBsb29rdXBSZXNwb25zZS5qc29uKCkpIGFzIGFueVxuXG4gICAgICAgICAgaWYgKCFsb29rdXBSZXNwb25zZS5vayB8fCBsb29rdXBSZXN1bHQ/LmVycm9ycz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGxvb2t1cCBTaG9waWZ5IGN1c3RvbWVyJyxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBsb29rdXBSZXN1bHQ/LmVycm9ycyB8fCBudWxsLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGVkZ2VzID0gbG9va3VwUmVzdWx0Py5kYXRhPy5jdXN0b21lcnM/LmVkZ2VzIHx8IFtdXG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSB8fCBlZGdlcy5sZW5ndGggPT09IDAgfHwgIWVkZ2VzWzBdPy5ub2RlPy5pZCkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSwgc2tpcHBlZDogJ2N1c3RvbWVyX25vdF9mb3VuZCcgfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBjdXN0b21lcklkID0gZWRnZXNbMF0ubm9kZS5pZFxuXG4gICAgICAgICAgY29uc3QgdXBkYXRlTXV0YXRpb24gPSBgXG4gICAgICAgICAgICBtdXRhdGlvbiBjdXN0b21lclVwZGF0ZSgkaWQ6IElEISwgJGlucHV0OiBDdXN0b21lcklucHV0ISkge1xuICAgICAgICAgICAgICBjdXN0b21lclVwZGF0ZShpZDogJGlkLCBpbnB1dDogJGlucHV0KSB7XG4gICAgICAgICAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgICAgICAgICAgaWRcbiAgICAgICAgICAgICAgICAgIGVtYWlsXG4gICAgICAgICAgICAgICAgICBmaXJzdE5hbWVcbiAgICAgICAgICAgICAgICAgIGxhc3ROYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVzZXJFcnJvcnMge1xuICAgICAgICAgICAgICAgICAgZmllbGRcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBgXG5cbiAgICAgICAgICBjb25zdCBpbnB1dCA9IHtcbiAgICAgICAgICAgIC4uLihmaXJzdE5hbWUgPyB7IGZpcnN0TmFtZSB9IDoge30pLFxuICAgICAgICAgICAgLi4uKGxhc3ROYW1lID8geyBsYXN0TmFtZSB9IDoge30pLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHVwZGF0ZVJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW5kcG9pbnQsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAnWC1TaG9waWZ5LUFjY2Vzcy1Ub2tlbic6IHNob3BpZnlBZG1pbkFwaVRva2VuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgcXVlcnk6IHVwZGF0ZU11dGF0aW9uLFxuICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBpZDogY3VzdG9tZXJJZCxcbiAgICAgICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCB1cGRhdGVSZXN1bHQgPSAoYXdhaXQgdXBkYXRlUmVzcG9uc2UuanNvbigpKSBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1c2VyRXJyb3JzID0gdXBkYXRlUmVzdWx0Py5kYXRhPy5jdXN0b21lclVwZGF0ZT8udXNlckVycm9ycyB8fCBbXVxuXG4gICAgICAgICAgaWYgKCF1cGRhdGVSZXNwb25zZS5vayB8fCB1cGRhdGVSZXN1bHQ/LmVycm9ycz8ubGVuZ3RoIHx8IHVzZXJFcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHVwZGF0ZSBTaG9waWZ5IGN1c3RvbWVyJyxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiB1cGRhdGVSZXN1bHQ/LmVycm9ycyB8fCB1c2VyRXJyb3JzIHx8IG51bGwsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgb2s6IHRydWUsXG4gICAgICAgICAgICAgIGN1c3RvbWVyOiB1cGRhdGVSZXN1bHQ/LmRhdGE/LmN1c3RvbWVyVXBkYXRlPy5jdXN0b21lciB8fCBudWxsLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc2VuZC1zaG9waWZ5LWN1c3RvbWVyLWludml0ZScsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2hvcGlmeVN0b3JlVXJsIHx8ICFzaG9waWZ5QWRtaW5BcGlUb2tlbikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnTWlzc2luZyBTSE9QSUZZX1NUT1JFX1VSTCBvciBTSE9QSUZZX0FETUlOX0FQSV9UT0tFTiBpbiBzZXJ2ZXIgZW52LicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSkpIGFzIHsgc2hvcGlmeUN1c3RvbWVySWQ/OiBzdHJpbmcgfVxuICAgICAgICAgIGNvbnN0IHNob3BpZnlDdXN0b21lcklkID0gdHlwZW9mIGJvZHkuc2hvcGlmeUN1c3RvbWVySWQgPT09ICdzdHJpbmcnID8gYm9keS5zaG9waWZ5Q3VzdG9tZXJJZC50cmltKCkgOiAnJ1xuICAgICAgICAgIGlmICghc2hvcGlmeUN1c3RvbWVySWQgfHwgIXNob3BpZnlDdXN0b21lcklkLnN0YXJ0c1dpdGgoJ2dpZDovL3Nob3BpZnkvQ3VzdG9tZXIvJykpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIG9yIGludmFsaWQgc2hvcGlmeUN1c3RvbWVySWQnIH0pKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFN0b3JlVXJsID0gc2hvcGlmeVN0b3JlVXJsLnN0YXJ0c1dpdGgoJ2h0dHAnKVxuICAgICAgICAgICAgPyBzaG9waWZ5U3RvcmVVcmxcbiAgICAgICAgICAgIDogYGh0dHBzOi8vJHtzaG9waWZ5U3RvcmVVcmx9YFxuICAgICAgICAgIGNvbnN0IGVuZHBvaW50ID0gYCR7bm9ybWFsaXplZFN0b3JlVXJsfS9hZG1pbi9hcGkvJHtzaG9waWZ5QXBpVmVyc2lvbn0vZ3JhcGhxbC5qc29uYFxuXG4gICAgICAgICAgY29uc3QgbXV0YXRpb24gPSBgXG4gICAgICAgICAgICBtdXRhdGlvbiBjdXN0b21lclNlbmRBY2NvdW50SW52aXRlRW1haWwoJGN1c3RvbWVySWQ6IElEISkge1xuICAgICAgICAgICAgICBjdXN0b21lclNlbmRBY2NvdW50SW52aXRlRW1haWwoY3VzdG9tZXJJZDogJGN1c3RvbWVySWQpIHtcbiAgICAgICAgICAgICAgICBjdXN0b21lciB7IGlkIH1cbiAgICAgICAgICAgICAgICB1c2VyRXJyb3JzIHsgZmllbGQgbWVzc2FnZSB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBgXG4gICAgICAgICAgY29uc3QgaW52aXRlUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdYLVNob3BpZnktQWNjZXNzLVRva2VuJzogc2hvcGlmeUFkbWluQXBpVG9rZW4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBxdWVyeTogbXV0YXRpb24sXG4gICAgICAgICAgICAgIHZhcmlhYmxlczogeyBjdXN0b21lcklkOiBzaG9waWZ5Q3VzdG9tZXJJZCB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb25zdCBpbnZpdGVSZXN1bHQgPSAoYXdhaXQgaW52aXRlUmVzcG9uc2UuanNvbigpKSBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1c2VyRXJyb3JzID0gaW52aXRlUmVzdWx0Py5kYXRhPy5jdXN0b21lclNlbmRBY2NvdW50SW52aXRlRW1haWw/LnVzZXJFcnJvcnMgfHwgW11cbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSBpbnZpdGVSZXN1bHQ/LmVycm9ycyB8fCBbXVxuXG4gICAgICAgICAgaWYgKCFpbnZpdGVSZXNwb25zZS5vayB8fCBlcnJvcnMubGVuZ3RoIHx8IHVzZXJFcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHNlbmQgU2hvcGlmeSBhY2NvdW50IGludml0ZSBlbWFpbCcsXG4gICAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3JzLmxlbmd0aCA/IGVycm9ycyA6IHVzZXJFcnJvcnMsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdJbnZpdGUgZW1haWwgc2VudCcgfSkpXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zaG9waWZ5LW9yZGVyLXByZXZpZXcnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNob3BpZnlTdG9yZVVybCB8fCAhc2hvcGlmeUFkbWluQXBpVG9rZW4pIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBlcnJvcjogJ01pc3NpbmcgU0hPUElGWV9TVE9SRV9VUkwgb3IgU0hPUElGWV9BRE1JTl9BUElfVE9LRU4gaW4gc2VydmVyIGVudi4nLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gKGF3YWl0IHJlYWRKc29uQm9keShyZXEpKSBhcyB7IG9yZGVySWRzPzogdW5rbm93bltdIH1cbiAgICAgICAgICBjb25zdCBvcmRlcklkcyA9IEFycmF5LmlzQXJyYXkoYm9keS5vcmRlcklkcylcbiAgICAgICAgICAgID8gYm9keS5vcmRlcklkcy5tYXAoKGlkKSA9PiBTdHJpbmcoaWQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLnNsaWNlKDAsIDEwKVxuICAgICAgICAgICAgOiBbXVxuXG4gICAgICAgICAgaWYgKCFvcmRlcklkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIHByZXZpZXdzOiB7fSB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTdG9yZVVybCA9IHNob3BpZnlTdG9yZVVybC5zdGFydHNXaXRoKCdodHRwJylcbiAgICAgICAgICAgID8gc2hvcGlmeVN0b3JlVXJsXG4gICAgICAgICAgICA6IGBodHRwczovLyR7c2hvcGlmeVN0b3JlVXJsfWBcblxuICAgICAgICAgIGNvbnN0IHByZXZpZXdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cblxuICAgICAgICAgIGZvciAoY29uc3Qgb3JkZXJJZCBvZiBvcmRlcklkcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgb3JkZXJVcmwgPSBgJHtub3JtYWxpemVkU3RvcmVVcmx9L2FkbWluL2FwaS8ke3Nob3BpZnlBcGlWZXJzaW9ufS9vcmRlcnMvJHtlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgICAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgICAgICAgKX0uanNvbj9zdGF0dXM9YW55JmZpZWxkcz1pZCxuYW1lLGN1cnJlbmN5LGxpbmVfaXRlbXNgXG4gICAgICAgICAgICAgIGNvbnN0IG9yZGVyUmVzID0gYXdhaXQgZmV0Y2hTaG9waWZ5QWRtaW5Kc29uKG9yZGVyVXJsKVxuICAgICAgICAgICAgICBjb25zdCBvcmRlciA9IG9yZGVyUmVzPy5kYXRhPy5vcmRlciB8fCBudWxsXG4gICAgICAgICAgICAgIGlmICghb3JkZXIpIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgY29uc3QgZmlyc3RJdGVtID1cbiAgICAgICAgICAgICAgICBBcnJheS5pc0FycmF5KG9yZGVyLmxpbmVfaXRlbXMpICYmIG9yZGVyLmxpbmVfaXRlbXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgPyBvcmRlci5saW5lX2l0ZW1zWzBdXG4gICAgICAgICAgICAgICAgICA6IG51bGxcblxuICAgICAgICAgICAgICBsZXQgaW1hZ2VVcmwgPVxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbT8uaW1hZ2U/LnNyYyB8fFxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbT8uaW1hZ2U/LnVybCB8fFxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbT8uZmVhdHVyZWRfaW1hZ2U/LnNyYyB8fFxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbT8uZmVhdHVyZWRfaW1hZ2U/LnVybCB8fFxuICAgICAgICAgICAgICAgIG51bGxcblxuICAgICAgICAgICAgICBpZiAoIWltYWdlVXJsICYmIGZpcnN0SXRlbT8ucHJvZHVjdF9pZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RVcmwgPSBgJHtub3JtYWxpemVkU3RvcmVVcmx9L2FkbWluL2FwaS8ke3Nob3BpZnlBcGlWZXJzaW9ufS9wcm9kdWN0cy8ke2VuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgICAgICAgICAgIFN0cmluZyhmaXJzdEl0ZW0ucHJvZHVjdF9pZCksXG4gICAgICAgICAgICAgICAgKX0uanNvbj9maWVsZHM9aWQsaW1hZ2UsaW1hZ2VzLHRpdGxlYFxuICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RSZXMgPSBhd2FpdCBmZXRjaFNob3BpZnlBZG1pbkpzb24ocHJvZHVjdFVybClcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdFJlcz8uZGF0YT8ucHJvZHVjdCB8fCBudWxsXG4gICAgICAgICAgICAgICAgaW1hZ2VVcmwgPVxuICAgICAgICAgICAgICAgICAgcHJvZHVjdD8uaW1hZ2U/LnNyYyB8fFxuICAgICAgICAgICAgICAgICAgKEFycmF5LmlzQXJyYXkocHJvZHVjdD8uaW1hZ2VzKSA/IHByb2R1Y3QuaW1hZ2VzWzBdPy5zcmMgOiBudWxsKSB8fFxuICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcHJldmlld3Nbb3JkZXJJZF0gPSB7XG4gICAgICAgICAgICAgICAgb3JkZXJOYW1lOiB0eXBlb2Ygb3JkZXIubmFtZSA9PT0gJ3N0cmluZycgPyBvcmRlci5uYW1lIDogbnVsbCxcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdHlwZW9mIG9yZGVyLmN1cnJlbmN5ID09PSAnc3RyaW5nJyA/IG9yZGVyLmN1cnJlbmN5IDogbnVsbCxcbiAgICAgICAgICAgICAgICBwcm9kdWN0VGl0bGU6XG4gICAgICAgICAgICAgICAgICB0eXBlb2YgZmlyc3RJdGVtPy50aXRsZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBmaXJzdEl0ZW0udGl0bGVcbiAgICAgICAgICAgICAgICAgICAgOiAodHlwZW9mIGZpcnN0SXRlbT8ubmFtZSA9PT0gJ3N0cmluZycgPyBmaXJzdEl0ZW0ubmFtZSA6IG51bGwpLFxuICAgICAgICAgICAgICAgIGltYWdlVXJsOiB0eXBlb2YgaW1hZ2VVcmwgPT09ICdzdHJpbmcnID8gaW1hZ2VVcmwgOiBudWxsLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgLy8gSWdub3JlIHBlci1vcmRlciBmYWlsdXJlcyBpbiBkZXYgbWlkZGxld2FyZS5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIHByZXZpZXdzIH0pKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc2hvcGlmeS10cmFjay1vcmRlcicsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2hvcGlmeVN0b3JlVXJsIHx8ICFzaG9waWZ5QWRtaW5BcGlUb2tlbikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIGVycm9yOiAnTWlzc2luZyBTSE9QSUZZX1NUT1JFX1VSTCBvciBTSE9QSUZZX0FETUlOX0FQSV9UT0tFTiBpbiBzZXJ2ZXIgZW52LicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSkpIGFzIHsgb3JkZXJOdW1iZXI/OiBzdHJpbmc7IGVtYWlsPzogc3RyaW5nIH1cbiAgICAgICAgICBjb25zdCByYXdPcmRlck51bWJlciA9IFN0cmluZyhib2R5Lm9yZGVyTnVtYmVyIHx8ICcnKS50cmltKClcbiAgICAgICAgICBjb25zdCBvcmRlck51bWJlciA9IHJhd09yZGVyTnVtYmVyXG4gICAgICAgICAgICA/IHJhd09yZGVyTnVtYmVyLnN0YXJ0c1dpdGgoJyMnKVxuICAgICAgICAgICAgICA/IHJhd09yZGVyTnVtYmVyXG4gICAgICAgICAgICAgIDogYCMke3Jhd09yZGVyTnVtYmVyfWBcbiAgICAgICAgICAgIDogJydcbiAgICAgICAgICBjb25zdCBlbWFpbCA9IFN0cmluZyhib2R5LmVtYWlsIHx8ICcnKVxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcblxuICAgICAgICAgIGlmICghb3JkZXJOdW1iZXIgfHwgIWVtYWlsKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBmaWVsZHM6IG9yZGVyTnVtYmVyIGFuZCBlbWFpbCcgfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBub3JtYWxpemVkU3RvcmVVcmwgPSBzaG9waWZ5U3RvcmVVcmwuc3RhcnRzV2l0aCgnaHR0cCcpXG4gICAgICAgICAgICA/IHNob3BpZnlTdG9yZVVybFxuICAgICAgICAgICAgOiBgaHR0cHM6Ly8ke3Nob3BpZnlTdG9yZVVybH1gXG4gICAgICAgICAgY29uc3Qgb3JkZXJzVXJsID0gYCR7bm9ybWFsaXplZFN0b3JlVXJsfS9hZG1pbi9hcGkvJHtzaG9waWZ5QXBpVmVyc2lvbn0vb3JkZXJzLmpzb24/c3RhdHVzPWFueSZuYW1lPSR7ZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgICAgb3JkZXJOdW1iZXIsXG4gICAgICAgICAgKX0mZmllbGRzPWlkLG5hbWUsb3JkZXJfbnVtYmVyLGVtYWlsLGNyZWF0ZWRfYXQsZmluYW5jaWFsX3N0YXR1cyxmdWxmaWxsbWVudF9zdGF0dXMsZnVsZmlsbG1lbnRzLHRvdGFsX3ByaWNlLGN1cnJlbmN5LGxpbmVfaXRlbXNgXG5cbiAgICAgICAgICBjb25zdCBvcmRlclJlcyA9IGF3YWl0IGZldGNoU2hvcGlmeUFkbWluSnNvbihvcmRlcnNVcmwpXG4gICAgICAgICAgaWYgKCFvcmRlclJlcy5vaykge1xuICAgICAgICAgICAgaWYgKGlzSW52YWxpZFNob3BpZnlUb2tlbihvcmRlclJlcy5kYXRhKSkge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICdTaG9waWZ5IEFkbWluIHRva2VuIGlzIGludmFsaWQuIFVwZGF0ZSBTSE9QSUZZX0FETUlOX0FQSV9UT0tFTiBpbiBzZXJ2ZXIgZW52aXJvbm1lbnQuJyxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc01pc3NpbmdSZWFkT3JkZXJzU2NvcGUob3JkZXJSZXMuZGF0YSkpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDNcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOlxuICAgICAgICAgICAgICAgICAgICAnU2hvcGlmeSBBUEkgYWNjZXNzIGlzIG1pc3NpbmcgcmVhZF9vcmRlcnMgcGVybWlzc2lvbi4gQXBwcm92ZSBhbmQgcmVpbnN0YWxsIHlvdXIgYXBwIHNjb3BlcyBpbiBTaG9waWZ5IGFkbWluLicsXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnU2hvcGlmeSByZXF1ZXN0IGZhaWxlZCcsXG4gICAgICAgICAgICAgICAgZGV0YWlsczogb3JkZXJSZXMuZGF0YSB8fCBudWxsLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG9yZGVycyA9IEFycmF5LmlzQXJyYXkob3JkZXJSZXMuZGF0YT8ub3JkZXJzKSA/IG9yZGVyUmVzLmRhdGEub3JkZXJzIDogW11cbiAgICAgICAgICBjb25zdCBvcmRlciA9IG9yZGVycy5maW5kKChjYW5kaWRhdGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FuZGlkYXRlRW1haWwgPSBTdHJpbmcoY2FuZGlkYXRlPy5lbWFpbCB8fCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUVtYWlsID09PSBlbWFpbFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoIW9yZGVyKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnT3JkZXIgbm90IGZvdW5kIGZvciBwcm92aWRlZCBlbWFpbCBhbmQgb3JkZXIgbnVtYmVyJyB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGZpcnN0TGluZUl0ZW0gPVxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheShvcmRlci5saW5lX2l0ZW1zKSAmJiBvcmRlci5saW5lX2l0ZW1zLmxlbmd0aCA+IDAgPyBvcmRlci5saW5lX2l0ZW1zWzBdIDogbnVsbFxuICAgICAgICAgIGNvbnN0IGZ1bGZpbGxtZW50cyA9IEFycmF5LmlzQXJyYXkob3JkZXIuZnVsZmlsbG1lbnRzKSA/IG9yZGVyLmZ1bGZpbGxtZW50cyA6IFtdXG4gICAgICAgICAgY29uc3QgdHJhY2tpbmcgPSBmdWxmaWxsbWVudHMuZmxhdE1hcCgoZnVsZmlsbG1lbnQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcGFueSA9IFN0cmluZyhmdWxmaWxsbWVudD8udHJhY2tpbmdfY29tcGFueSB8fCAnJykudHJpbSgpIHx8IG51bGxcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IFN0cmluZyhmdWxmaWxsbWVudD8uc2hpcG1lbnRfc3RhdHVzIHx8ICcnKS50cmltKCkgfHwgbnVsbFxuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmdWxmaWxsbWVudD8udHJhY2tpbmdfbnVtYmVycykgJiYgZnVsZmlsbG1lbnQudHJhY2tpbmdfbnVtYmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZ1bGZpbGxtZW50LnRyYWNraW5nX251bWJlcnMubWFwKCh0cmFja2luZ051bWJlcjogdW5rbm93biwgaW5kZXg6IG51bWJlcikgPT4gKHtcbiAgICAgICAgICAgICAgICBudW1iZXI6IFN0cmluZyh0cmFja2luZ051bWJlciB8fCAnJykudHJpbSgpIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgdXJsOlxuICAgICAgICAgICAgICAgICAgQXJyYXkuaXNBcnJheShmdWxmaWxsbWVudD8udHJhY2tpbmdfdXJscykgJiYgZnVsZmlsbG1lbnQudHJhY2tpbmdfdXJsc1tpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgPyBTdHJpbmcoZnVsZmlsbG1lbnQudHJhY2tpbmdfdXJsc1tpbmRleF0pLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgY29tcGFueSxcbiAgICAgICAgICAgICAgICBzdGF0dXMsXG4gICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzaW5nbGVOdW1iZXIgPSBTdHJpbmcoZnVsZmlsbG1lbnQ/LnRyYWNraW5nX251bWJlciB8fCAnJykudHJpbSgpIHx8IG51bGxcbiAgICAgICAgICAgIGNvbnN0IHNpbmdsZVVybCA9IFN0cmluZyhmdWxmaWxsbWVudD8udHJhY2tpbmdfdXJsIHx8ICcnKS50cmltKCkgfHwgbnVsbFxuICAgICAgICAgICAgaWYgKCFzaW5nbGVOdW1iZXIgJiYgIXNpbmdsZVVybCkgcmV0dXJuIFtdXG4gICAgICAgICAgICByZXR1cm4gW3sgbnVtYmVyOiBzaW5nbGVOdW1iZXIsIHVybDogc2luZ2xlVXJsLCBjb21wYW55LCBzdGF0dXMgfV1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgb2s6IHRydWUsXG4gICAgICAgICAgICAgIG9yZGVyOiB7XG4gICAgICAgICAgICAgICAgaWQ6IG9yZGVyLmlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IG9yZGVyLm5hbWUsXG4gICAgICAgICAgICAgICAgb3JkZXJOdW1iZXI6IG9yZGVyLm9yZGVyX251bWJlcixcbiAgICAgICAgICAgICAgICBlbWFpbDogb3JkZXIuZW1haWwsXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBvcmRlci5jcmVhdGVkX2F0LFxuICAgICAgICAgICAgICAgIGZpbmFuY2lhbFN0YXR1czogb3JkZXIuZmluYW5jaWFsX3N0YXR1cyxcbiAgICAgICAgICAgICAgICBmdWxmaWxsbWVudFN0YXR1czogb3JkZXIuZnVsZmlsbG1lbnRfc3RhdHVzLFxuICAgICAgICAgICAgICAgIHRvdGFsUHJpY2U6IE51bWJlci5wYXJzZUZsb2F0KG9yZGVyLnRvdGFsX3ByaWNlIHx8ICcwJyksXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IG9yZGVyLmN1cnJlbmN5IHx8ICdDQUQnLFxuICAgICAgICAgICAgICAgIGZpcnN0SXRlbVRpdGxlOiBmaXJzdExpbmVJdGVtPy50aXRsZSB8fCBudWxsLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB0cmFja2luZyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3NlbmQtcGFydG5lci1hcHByb3ZhbC1lbWFpbCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDVcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzZW5kQXBpS2V5KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6ICdNaXNzaW5nIFJFU0VORF9BUElfS0VZIGluIGxvY2FsIHNlcnZlciBlbnYuJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHJlYWRKc29uQm9keShyZXEpXG4gICAgICAgICAgY29uc3QgdG8gPSBjbGVhbklubGluZShwYXlsb2FkLnRvIHx8ICcnKVxuICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBTdHJpbmcocGF5bG9hZC5zdWJqZWN0IHx8ICcnKS50cmltKClcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0gU3RyaW5nKHBheWxvYWQubWVzc2FnZSB8fCAnJykudHJpbSgpXG4gICAgICAgICAgY29uc3QgaHRtbCA9IFN0cmluZyhwYXlsb2FkLmh0bWwgfHwgJycpLnRyaW0oKVxuICAgICAgICAgIGNvbnN0IGNvbXBhbnlOYW1lID0gU3RyaW5nKHBheWxvYWQuY29tcGFueU5hbWUgfHwgJycpLnRyaW0oKVxuICAgICAgICAgIGNvbnN0IGZsb3dUYWcgPSBTdHJpbmcocGF5bG9hZC5mbG93VGFnIHx8ICdwYXJ0bmVyX2FwcHJvdmFsJykudHJpbSgpIHx8ICdwYXJ0bmVyX2FwcHJvdmFsJ1xuICAgICAgICAgIGNvbnN0IHNhZmVGbG93VGFnID0gdG9SZXNlbmRUYWdUb2tlbihmbG93VGFnLCAncGFydG5lcl9mbG93JylcbiAgICAgICAgICBjb25zdCBzYWZlQ29tcGFueVRhZyA9IHRvUmVzZW5kVGFnVG9rZW4oY29tcGFueU5hbWUsICd1bmtub3duJylcblxuICAgICAgICAgIGlmICghdG8gfHwgIXN1YmplY3QgfHwgIW1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIHJlcXVpcmVkIGZpZWxkczogdG8sIHN1YmplY3QsIG1lc3NhZ2UnIH0pKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcmVzZW5kUmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucmVzZW5kLmNvbS9lbWFpbHMnLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Jlc2VuZEFwaUtleX1gLFxuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZnJvbTogZmlyZWJhbGxGcm9tRW1haWwsXG4gICAgICAgICAgICAgIHRvOiBbdG9dLFxuICAgICAgICAgICAgICBzdWJqZWN0LFxuICAgICAgICAgICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgICAgICAgICBodG1sOiBodG1sIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgdGFnczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2Zsb3cnLCB2YWx1ZTogc2FmZUZsb3dUYWcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb21wYW55JywgdmFsdWU6IHNhZmVDb21wYW55VGFnIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc2VuZFJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKVxuICAgICAgICAgIGlmICghcmVzZW5kUmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdSZXNlbmQgcmVqZWN0ZWQgdGhlIGVtYWlsIHJlcXVlc3QuJyxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBkYXRhLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgIHByb3ZpZGVyOiAncmVzZW5kJyxcbiAgICAgICAgICAgICAgaWQ6IChkYXRhIGFzIHsgaWQ/OiBzdHJpbmcgfSk/LmlkIHx8IG51bGwsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXG4gICAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIC8qKiBUYWlsd2luZCB2NCBlc3QgYXBwbGlxdVx1MDBFOSB2aWEgcG9zdGNzcy5jb25maWcuanMgKyBAdGFpbHdpbmRjc3MvcG9zdGNzcyAocGFzIEB0YWlsd2luZGNzcy92aXRlLCBcdTAwRTl2aXRlIGNvbmZsaXQgQGxheWVyKS4gKi9cbiAgcGx1Z2luczogW3JlYWN0KCksIHNob3BpZnlDdXN0b21lckFwaVBsdWdpbihtb2RlKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgICAvKiogRGV1eCBlbnRyXHUwMEU5ZXMgZGlzdGluY3RlcyB2ZXJzIGRlcyAudHMgOiB1biBzZXVsIGZpY2hpZXIgLnRzIHBvdXIgdG91dCBsZSBwclx1MDBFOWZpeGUgZmFpc2FpdCByXHUwMEU5c291ZHJlIFx1MjAyNi9pbmRleC5qcyBzb3VzIGNlIGNoZW1pbiAoRU5PRU5UKS4gKi9cbiAgICAgICd1c2Utc3luYy1leHRlcm5hbC1zdG9yZS9zaGltL2luZGV4LmpzJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICdzcmMvc2hpbXMvdXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUtc2hpbS9pbmRleC50cycsXG4gICAgICApLFxuICAgICAgJ3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlL3NoaW0vd2l0aC1zZWxlY3Rvci5qcyc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAnc3JjL3NoaW1zL3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlLXNoaW0vd2l0aC1zZWxlY3Rvci50cycsXG4gICAgICApLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbGVuaXMnXSxcbiAgICBpbmNsdWRlOiBbXG4gICAgICAndGhyZWUnLFxuICAgICAgJ3RocmVlLWdsb2JlJyxcbiAgICAgICdAcmVhY3QtdGhyZWUvZmliZXInLFxuICAgICAgJ0ByZWFjdC10aHJlZS9kcmVpJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgIC8qKiBDSlMgXHUyMTkyIEVTTSA6IFx1MDBFOXZpdGUgZXJyZXVycyBkXHUyMDE5ZXhwb3J0IHN1ciB1c2VTeW5jRXh0ZXJuYWxTdG9yZSAocmVhY3QtYXJpYSAvIEhlcm9VSSkuICovXG4gICAgICAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUvc2hpbScsXG4gICAgICAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUnLFxuICAgIF0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHdhdGNoOiB7XG4gICAgICB1c2VQb2xsaW5nOiB0cnVlLFxuICAgICAgaW50ZXJ2YWw6IDE1MCxcbiAgICB9LFxuICB9LFxufSkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRULFNBQVMsY0FBYyxlQUE0QjtBQUMvVyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLFNBQVMseUJBQXlCLE1BQXNCO0FBQ3RELFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLGtCQUFrQixJQUFJLHFCQUFxQixJQUFJLDBC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QUFlLElBQUk7QUFDdEIsZ0JBQUksYUFBYTtBQUNqQixnQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsZ0JBQUk7QUFBQSxjQUNGLEtBQUssVUFBVTtBQUFBLGdCQUNiLE9BQU87QUFBQSxnQkFDUCxTQUFTO0FBQUEsY0FDWCxDQUFDO0FBQUEsWUFDSDtBQUNBO0FBQUEsVUFDRjtBQUVBLGNBQUksYUFBYTtBQUNqQixjQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxjQUFJO0FBQUEsWUFDRixLQUFLLFVBQVU7QUFBQSxjQUNiLFNBQVM7QUFBQSxjQUNULFVBQVU7QUFBQSxjQUNWLElBQUssTUFBMEIsTUFBTTtBQUFBLFlBQ3ZDLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRixTQUFTLE9BQU87QUFDZCxjQUFJLGFBQWE7QUFDakIsY0FBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsY0FBSTtBQUFBLFlBQ0YsS0FBSyxVQUFVO0FBQUEsY0FDYixPQUFPO0FBQUEsY0FDUCxTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVTtBQUFBLFlBQ3BELENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBO0FBQUEsRUFFekMsU0FBUyxDQUFDLE1BQU0sR0FBRyx5QkFBeUIsSUFBSSxDQUFDO0FBQUEsRUFDakQsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBO0FBQUEsTUFFbEMseUNBQXlDLEtBQUs7QUFBQSxRQUM1QztBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxpREFBaUQsS0FBSztBQUFBLFFBQ3BEO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLE9BQU87QUFBQSxJQUNqQixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
