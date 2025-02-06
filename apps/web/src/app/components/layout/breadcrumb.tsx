import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="breadcrumbs rounded text-sm md:text-base  my-4"
      aria-label="パンくずリストナビゲーション"
    >
      <ul>
        {items.map((item) => (
          <li key={item.label} className={item.isCurrent ? "font-bold" : ""}>
            {item.href ? (
              <Link
                href={item.href}
                {...(item.isCurrent && { "aria-current": "page" })}
              >
                {item.label}
              </Link>
            ) : (
              <span {...(item.isCurrent && { "aria-current": "page" })}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
