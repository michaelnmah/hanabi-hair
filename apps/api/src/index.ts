import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { z } from "zod";
import { fallbackCatalog, type CatalogProduct } from "./catalog.js";
import { stripe, supabase } from "./services.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(10),
});

const subscriberSchema = z.object({
  email: z.string().email().max(254),
});

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      response.status(503).json({ error: "Stripe webhook is not configured." });
      return;
    }

    const signature = request.headers["stripe-signature"];
    if (!signature) {
      response.status(400).json({ error: "Missing Stripe signature." });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      if (event.type === "checkout.session.completed" && supabase) {
        const session = event.data.object;
        const { error } = await supabase
          .from("orders")
          .update({
            status: "paid",
            customer_email: session.customer_details?.email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        if (error) throw error;
      }

      response.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error", error);
      response.status(400).json({ error: "Invalid webhook payload." });
    }
  },
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed."));
    },
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    services: {
      database: Boolean(supabase),
      payments: Boolean(stripe),
    },
  });
});

app.get("/api/products", async (_request, response, next) => {
  try {
    if (!supabase) {
      response.json({ products: fallbackCatalog, source: "fallback" });
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("slug,name,description,price_gbp,texture,active")
      .eq("active", true)
      .order("sort_order");

    if (error) throw error;
    response.json({ products: data, source: "supabase" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/checkout", async (request, response, next) => {
  try {
    if (!stripe) {
      response.status(503).json({
        error:
          "Secure checkout is ready for a Stripe key. Add STRIPE_SECRET_KEY on Render.",
      });
      return;
    }

    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Your bag contains invalid items." });
      return;
    }

    const requestedSlugs = [...new Set(parsed.data.items.map((item) => item.slug))];
    let catalog: CatalogProduct[] = fallbackCatalog;

    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .select("slug,name,description,price_gbp,texture,active")
        .in("slug", requestedSlugs)
        .eq("active", true);
      if (error) throw error;
      catalog = (data || []) as CatalogProduct[];
    }

    const productsBySlug = new Map(
      catalog.map((product) => [product.slug, product]),
    );
    const validatedItems = parsed.data.items.map((item) => {
      const product = productsBySlug.get(item.slug);
      if (!product) {
        throw new Error(`Product is unavailable: ${item.slug}`);
      }
      return { product, quantity: item.quantity };
    });

    const totalGbp = validatedItems.reduce(
      (sum, item) => sum + item.product.price_gbp * item.quantity,
      0,
    );

    let orderId: string | null = null;
    if (supabase) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          status: "pending",
          currency: "gbp",
          total_gbp: totalGbp,
        })
        .select("id")
        .single();
      if (orderError) throw orderError;
      orderId = order.id;

      const { error: itemError } = await supabase.from("order_items").insert(
        validatedItems.map(({ product, quantity }) => ({
          order_id: orderId,
          product_slug: product.slug,
          product_name: product.name,
          unit_price_gbp: product.price_gbp,
          quantity,
        })),
      );
      if (itemError) throw itemError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      allow_promotion_codes: true,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["GB", "IE", "FR", "DE", "NL", "BE"],
      },
      line_items: validatedItems.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: "gbp",
          unit_amount: product.price_gbp * 100,
          product_data: {
            name: `Hanami Hair — ${product.name}`,
            description: product.description,
            metadata: { slug: product.slug },
          },
        },
      })),
      metadata: orderId ? { order_id: orderId } : undefined,
      success_url: `${clientUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/?checkout=cancelled`,
    });

    if (supabase && orderId) {
      const { error } = await supabase
        .from("orders")
        .update({
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) throw error;
    }

    response.status(201).json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

app.post("/api/subscribers", async (request, response, next) => {
  try {
    const parsed = subscriberSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    if (!supabase) {
      response.status(503).json({
        error: "Newsletter signup is ready for your Supabase credentials.",
      });
      return;
    }

    const { error } = await supabase.from("subscribers").upsert(
      {
        email: parsed.data.email.toLowerCase(),
        source: "website",
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) throw error;

    response.status(201).json({ subscribed: true });
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);
    const safeMessage = error.message.startsWith("Product is unavailable")
      ? error.message
      : "Something went wrong. Please try again.";
    response.status(500).json({ error: safeMessage });
  },
);

app.listen(port, () => {
  console.log(`Hanami Hair API listening on port ${port}`);
});

