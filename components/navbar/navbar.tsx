import { getNavbar } from "@/lib/api/navbar";
import type { NavbarItem } from "@/lib/api/navbar";
import { NavbarMobileLauncher } from "./_components/navbar-mobile";
import { ChevronDown } from "@/lib/icons";

const LOGO_URL =
  "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

function isExternal(url: string): boolean {
  try {
    const host = new URL(url).host;
    return host !== "vistasolve.com" && host !== "www.vistasolve.com";
  } catch {
    return true;
  }
}

export default async function Navbar() {
  const items = await getNavbar().catch(() => []);
  const links = items.filter((i) => !i.is_cta);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="https://vistasolve.com/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Vistasolve" className="h-8 w-auto" />
          </a>

          <div className="hidden md:flex items-center space-x-0.5">
            {links.map((item) => (
              <DesktopNavItem key={item.id} item={item} />
            ))}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <NavbarMobileLauncher items={items} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function DesktopNavItem({ item }: { item: NavbarItem }) {
  if (!item.has_children) {
    return (
      <a
        key={item.id}
        href={item.url}
        target={isExternal(item.url) ? "_blank" : undefined}
        rel={isExternal(item.url) ? "noopener noreferrer" : undefined}
        className="px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        {item.title}
      </a>
    );
  }

  return (
    <div className="relative group">
      <button
        className="px-3 py-2 text-sm font-medium text-foreground flex items-center gap-1 transition-colors hover:text-primary"
        aria-haspopup="menu"
        type="button"
      >
        {item.title}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <div
        className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 pointer-events-none group-hover:pointer-events-auto"
      >
        <div className="px-2 py-1.5">
          {item.children.map((child) => (
            <a
              key={child.id}
              href={child.url}
              target={isExternal(child.url) ? "_blank" : undefined}
              rel={isExternal(child.url) ? "noopener noreferrer" : undefined}
              className="block px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {child.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
