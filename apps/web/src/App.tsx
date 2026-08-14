import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Instagram,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { products, type Product } from "./catalog";

type CartLine = Product & { quantity: number };
type ToastTone = "success" | "error";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";
const CART_STORAGE_KEY = "hanami-cart";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
});

const loadCart = (): CartLine[] => {
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((line) => {
      if (!line || typeof line !== "object") return [];
      const savedLine = line as { slug?: unknown; quantity?: unknown };
      const product = products.find((item) => item.slug === savedLine.slug);
      const quantity = Number(savedLine.quantity);
      if (!product || !Number.isFinite(quantity) || quantity < 1) return [];
      return [{ ...product, quantity: Math.min(99, Math.floor(quantity)) }];
    });
  } catch {
    return [];
  }
};

function App() {
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [subscribeBusy, setSubscribeBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<ToastTone>("success");
  const [subscribed, setSubscribed] = useState(false);
  const cartDrawerRef = useRef<HTMLElement>(null);
  const menuDrawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const showToast = (message: string, tone: ToastTone = "success") => {
    setToastTone(tone);
    setToast(message);
  };

  useEffect(() => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(
        cart.map(({ slug, quantity }) => ({ slug, quantity })),
      ),
    );
  }, [cart]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setCart([]);
      showToast("Your order is confirmed. Welcome to the Hanami ritual.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const drawer = cartOpen
      ? cartDrawerRef.current
      : menuOpen
        ? menuDrawerRef.current
        : null;
    if (!drawer) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      drawer.querySelector<HTMLElement>("button, a[href], input")?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCartOpen(false);
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [cartOpen, menuOpen]);

  const addToBag = (product: Product) => {
    setCart((current) => {
      const found = current.find((item) => item.slug === product.slug);
      if (found) {
        return current.map((item) =>
          item.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} added to your bag.`);
  };

  const updateQuantity = (slug: string, amount: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.slug === slug
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const checkout = async () => {
    if (!cart.length) return;
    setCheckoutBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ slug, quantity }) => ({ slug, quantity })),
        }),
      });
      const data = (await response.json()) as { url?: string };
      if (!response.ok || !data.url) {
        throw new Error("Checkout unavailable");
      }
      window.location.assign(data.url);
    } catch {
      showToast(
        "Checkout couldn’t start. Please try again or contact us.",
        "error",
      );
    } finally {
      setCheckoutBusy(false);
    }
  };

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribeBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    try {
      const response = await fetch(`${API_URL}/api/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setSubscribed(true);
      event.currentTarget.reset();
    } catch {
      showToast("We couldn’t save your email. Please try again.", "error");
    } finally {
      setSubscribeBusy(false);
    }
  };

  const exploreCollection = () => {
    setCartOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("collection")?.scrollIntoView();
    });
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="announcement">
        <p>Complimentary UK delivery on orders over £150</p>
        <span>Quiet luxury, made to move</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Hanami Hair home">
          <img src="/images/hanami-logo-crop.png" alt="" />
          <span>Hanami Hair</span>
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#collection">Shop</a>
          <a href="#ritual">The Hanami standard</a>
          <a href="#story">Our story</a>
        </nav>

        <div className="header-actions">
          <button
            className="bag-button"
            onClick={() => {
              setMenuOpen(false);
              setCartOpen(true);
            }}
            aria-label={`Open shopping bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          >
            <ShoppingBag size={19} strokeWidth={1.6} />
            <span>Bag</span>
            <span className="bag-count">{itemCount}</span>
          </button>
          <button
            className="icon-button menu-button"
            onClick={() => {
              setCartOpen(false);
              setMenuOpen(true);
            }}
            aria-label="Open menu"
          >
            <Menu size={21} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy reveal">
            <p className="eyebrow">The art of beautiful hair</p>
            <h1>
              Luxury
              <span>in every strand.</span>
            </h1>
            <p className="hero-intro">
              Exceptionally soft human hair, selected for graceful movement,
              lasting beauty and the confidence that feels entirely your own.
            </p>
            <div className="hero-actions">
              <a className="button button-light" href="#collection">
                Explore the collection <ArrowRight size={17} />
              </a>
              <a className="text-link" href="#ritual">
                Discover our standard <ArrowDownRight size={17} />
              </a>
            </div>
          </div>
          <div className="hero-image" aria-hidden="true">
            <img
              src="/images/hero-hair.jpg"
              alt=""
              width="1024"
              height="1536"
              fetchPriority="high"
            />
            <span className="hero-script">in bloom</span>
            <div className="hero-note">
              <span>01</span>
              <p>Signature body wave · natural dark</p>
            </div>
          </div>
          <a className="scroll-cue" href="#collection" aria-label="Scroll to collection">
            <span>Scroll to discover</span>
            <ChevronDown size={16} />
          </a>
        </section>

        <section className="manifesto" id="ritual">
          <p className="eyebrow">The Hanami standard</p>
          <h2>
            Hair should never merely be worn.
            <em> It should be felt.</em>
          </h2>
          <div className="manifesto-copy">
            <p>
              Every bundle is chosen for density, lustre and a beautifully
              natural finish—then prepared with the care of a couture piece.
            </p>
            <a className="text-link dark" href="#story">
              Why Hanami <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section className="collection" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The collection</p>
              <h2>Find your texture.</h2>
            </div>
            <p>
              Three timeless expressions. One uncompromising standard of
              softness and movement.
            </p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => (
              <article className="product-card grid-item" key={product.slug}>
                <div className="product-image">
                  <img
                    src="/images/hair-collection.jpg"
                    alt={`${product.name} luxury human hair texture`}
                    style={{ objectPosition: product.imagePosition }}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <span className="product-index">0{index + 1}</span>
                  <button
                    className="quick-add"
                    onClick={() => addToBag(product)}
                    aria-label={`Add ${product.name} to bag`}
                  >
                    <Plus size={18} />
                    <span>Quick add</span>
                  </button>
                </div>
                <div className="product-meta">
                  <div>
                    <p>{product.eyebrow}</p>
                    <h3>{product.name}</h3>
                  </div>
                  <span>{money.format(product.price)}</span>
                </div>
                <p className="product-description">{product.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="editorial" id="story">
          <div className="editorial-image">
            <img
              src="/images/editorial-wave.jpg"
              alt="Model wearing Hanami deep wave hair"
              loading="lazy"
            />
          </div>
          <div className="editorial-copy">
            <p className="eyebrow">More than an accessory</p>
            <h2>Your crown, <em>in bloom.</em></h2>
            <p>
              Inspired by the fleeting beauty of blossom season, Hanami Hair
              celebrates transformation without compromise. Our textures are
              curated to blend, move and live with you—beautiful on day one,
              even better as they become yours.
            </p>
            <dl className="standards">
              <div>
                <dt>01</dt>
                <dd>Ethically selected human hair</dd>
              </div>
              <div>
                <dt>02</dt>
                <dd>Full from weft to end</dd>
              </div>
              <div>
                <dt>03</dt>
                <dd>Crafted for repeat wear</dd>
              </div>
            </dl>
            <a className="button button-dark" href="#collection">
              Shop all textures <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section className="care">
          <div className="care-art" aria-hidden="true">
            <span>H</span>
            <Sparkles size={22} />
          </div>
          <div className="care-copy">
            <p className="eyebrow">The ritual</p>
            <h2>Beauty that lasts.</h2>
            <p>
              Considered care keeps every strand soft, luminous and full of
              movement. Your order includes our signature care card.
            </p>
            <a className="text-link dark" href="#newsletter">
              Join the private list <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section className="newsletter" id="newsletter">
          <div>
            <p className="eyebrow">The private list</p>
            <h2>Stay close to Hanami.</h2>
          </div>
          {subscribed ? (
            <p className="subscription-success">
              <Check size={19} /> You’re on the list. Welcome.
            </p>
          ) : (
            <form onSubmit={subscribe}>
              <label htmlFor="email">Email address</label>
              <div className="email-field">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  aria-label="Join the Hanami mailing list"
                  disabled={subscribeBusy}
                >
                  {subscribeBusy ? "Joining…" : "Join the list"}
                  {!subscribeBusy && <ArrowRight size={17} />}
                </button>
              </div>
              <p>Private launches, hair rituals and quiet luxuries. No noise.</p>
            </form>
          )}
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <img src="/images/hanami-logo-crop.png" alt="" />
          <div>
            <strong>Hanami Hair</strong>
            <span>Luxury in every strand.</span>
          </div>
        </div>
        <div className="footer-links">
          <div>
            <p>Explore</p>
            <a href="#collection">Shop textures</a>
            <a href="#ritual">Our standard</a>
            <a href="#story">Our story</a>
          </div>
          <div>
            <p>Care</p>
            <a href="#newsletter">Private list</a>
            <a href="mailto:hello@hanamihair.co.uk">Contact</a>
            <a href="mailto:hello@hanamihair.co.uk?subject=Delivery%20question">
              Delivery questions
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Hanami Hair</span>
          <a
            href="https://www.instagram.com/hanamihair/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hanami Hair on Instagram"
          >
            <Instagram size={18} /> Instagram
          </a>
        </div>
      </footer>

      <div
        className={`overlay ${cartOpen || menuOpen ? "is-visible" : ""}`}
        onClick={() => {
          setCartOpen(false);
          setMenuOpen(false);
        }}
        aria-hidden="true"
      />

      <aside
        ref={cartDrawerRef}
        className={`drawer cart-drawer ${cartOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal={cartOpen}
        aria-hidden={!cartOpen}
        aria-label="Shopping bag"
        inert={!cartOpen}
        tabIndex={-1}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2>Shopping bag <span>({itemCount})</span></h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
          >
            <X size={22} />
          </button>
        </div>
        <div className="cart-lines">
          {!cart.length ? (
            <div className="empty-cart">
              <ShoppingBag size={28} strokeWidth={1.2} />
              <p>Your bag is waiting for something beautiful.</p>
              <button
                className="text-link dark"
                onClick={exploreCollection}
              >
                Explore the collection <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-line" key={item.slug}>
                <img
                  src="/images/hair-collection.jpg"
                  alt=""
                  style={{ objectPosition: item.imagePosition }}
                />
                <div>
                  <p>{item.texture}</p>
                  <h3>{item.name}</h3>
                  <span>{money.format(item.price)}</span>
                  <div className="quantity">
                    <button
                      onClick={() => updateQuantity(item.slug, -1)}
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.slug, 1)}
                      aria-label={`Add one ${item.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {!!cart.length && (
          <div className="cart-summary">
            <div>
              <span>Subtotal</span>
              <strong>{money.format(subtotal)}</strong>
            </div>
            <p>Delivery calculated at checkout.</p>
            <button
              className="button button-dark checkout-button"
              onClick={checkout}
              disabled={checkoutBusy}
            >
              {checkoutBusy ? "Preparing checkout…" : "Secure checkout"}
              {!checkoutBusy && <ArrowRight size={17} />}
            </button>
            <span className="secure-note">Payments secured by Stripe</span>
          </div>
        )}
      </aside>

      <aside
        ref={menuDrawerRef}
        className={`drawer menu-drawer ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
        inert={!menuOpen}
        tabIndex={-1}
      >
        <button
          className="icon-button menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
        <nav>
          {[
            ["Shop", "#collection"],
            ["The Hanami standard", "#ritual"],
            ["Our story", "#story"],
            ["Hair care", "#newsletter"],
          ].map(([label, href], index) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              <span>0{index + 1}</span>
              {label}
              <ArrowRight size={19} />
            </a>
          ))}
        </nav>
        <p className="menu-script">your crown, in bloom</p>
      </aside>

      <div
        className={`toast ${toast ? "is-visible" : ""} ${toastTone === "error" ? "is-error" : ""}`}
        role={toastTone === "error" ? "alert" : "status"}
      >
        {toast &&
          (toastTone === "error" ? <X size={17} /> : <Check size={17} />)}
        <span>{toast}</span>
      </div>
    </>
  );
}

export default App;
