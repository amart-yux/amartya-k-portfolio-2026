import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import type { Category, ImageSource, Subwork } from "@/lib/content/types";

export type HomeWork = { slug: string; name: string; preview?: ImageSource };

type HomeInteractiveProps = {
  works: HomeWork[];
  subworks: Subwork[];
  categories: Category[];
  /** Category from the request URL so server and client render the same markup. */
  initialCategory?: string;
  /** Server-rendered intro column (Astro slot). */
  intro?: ReactNode;
};

const PARAM = "category";

/**
 * The interactive part of the home page: one hover preview shared by the work
 * list (each Work's Preview) and the Subworks strip (each Subwork's own
 * Preview), plus the URL-backed category filter (`/?category=web`) that
 * narrows the Subworks strip. No category selected shows every Subwork.
 */
export function HomeInteractive({ works, subworks, categories, initialCategory, intro }: HomeInteractiveProps) {
  const [preview, setPreview] = useState<ImageSource | undefined>();
  const [active, setActive] = useState<string | undefined>(initialCategory);

  useEffect(() => {
    const syncFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get(PARAM);
      setActive(categories.some((category) => category.slug === raw) ? (raw ?? undefined) : undefined);
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [categories]);

  const handleSelect = (slug: string) => {
    setActive(slug);
    window.history.replaceState(null, "", `${window.location.pathname}?${PARAM}=${slug}`);
  };

  const handleClear = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    setActive(undefined);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const hoverHandlers = (image: ImageSource | undefined) => ({
    onMouseEnter: () => setPreview(image),
    onMouseLeave: () => setPreview(undefined),
    onFocus: () => setPreview(image),
    onBlur: () => setPreview(undefined),
  });

  const visibleSubworks = active ? subworks.filter((subwork) => subwork.categorySlugs.includes(active)) : subworks;

  return (
    <>
      <div className="relative flex min-h-[90vh] w-full shrink-0 flex-col items-start justify-between gap-4 tablet:h-[96vh] tablet:min-h-0 tablet:gap-0">
        <section className="flex w-full flex-col items-start gap-4 tablet:flex-row tablet:justify-center">
          {intro}
          <div aria-hidden="true" className="hidden flex-[1_0_0px] self-stretch tablet:block" />
          <div className="flex w-full items-start justify-between gap-3 overflow-clip tablet:w-auto tablet:flex-[1_0_0px] tablet:justify-center tablet:gap-4">
            <div className="flex flex-[1_0_0px] items-start gap-1 overflow-clip">
              <p className="type-body shrink-0 text-muted-foreground">Selected work:</p>
              <ul className="grid flex-[1_0_0px] grid-cols-[repeat(2,minmax(50px,1fr))] gap-x-3 tablet:flex tablet:flex-col">
                {works.map((work) => (
                  <li key={work.slug} className="flex">
                    <a href={`/works/${work.slug}`} className="flex items-center" {...hoverHandlers(work.preview)}>
                      <span className="type-body type-action text-foreground" data-tone="accent" data-weight="default" data-active="false">
                        {work.name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-start gap-4">
              <div className="flex w-auto items-start gap-1 overflow-clip">
                <p className="type-body shrink-0 text-muted-foreground">Filter:</p>
                <ul className="flex flex-[1_0_0px] flex-col">
                  {categories.map((category) => (
                    <li key={category.slug} className="flex">
                      <button
                        type="button"
                        onClick={() => handleSelect(category.slug)}
                        aria-pressed={active === category.slug}
                        className="flex cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
                      >
                        <span
                          className="type-body type-action text-foreground"
                          data-tone="accent"
                          data-weight="filter"
                          data-active={active === category.slug ? "true" : "false"}
                        >
                          {category.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {active ? (
                <a href="/" onClick={handleClear} className="group flex items-center gap-0.5 text-foreground">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-3.5 shrink-0">
                    <g transform="translate(5.25 5.25)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
                      <path d="M 13.5 0 L 0 13.5" />
                      <path d="M 13.5 13.5 L 0 0" />
                    </g>
                  </svg>
                  <span className="type-body type-action text-foreground" data-tone="negative" data-weight="default" data-active="false">
                    Close
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid w-full justify-start gap-3 [grid-template-columns:repeat(auto-fill,36px)] tablet:gap-4 tablet:[grid-template-columns:repeat(auto-fill,72px)] desktop:[grid-template-columns:repeat(auto-fill,80px)]">
          {visibleSubworks.map((subwork) => (
            <a
              key={subwork.id}
              href={`/works/${subwork.parentSlug}`}
              aria-label={subwork.title}
              className="relative block aspect-[1470/854] w-full overflow-clip"
              {...hoverHandlers(subwork.preview)}
            >
              {subwork.banner ? (
                <img
                  src={subwork.banner.src}
                  srcSet={subwork.banner.srcset}
                  sizes="(min-width: 1440px) 80px, (min-width: 810px) 72px, 36px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="block size-full object-cover object-center"
                />
              ) : (
                <span aria-hidden="true" className="image-placeholder absolute inset-0" />
              )}
            </a>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[38%] hidden w-[33%] -translate-x-1/2 -translate-y-1/2 desktop:block">
        {preview ? (
          <img
            src={preview.src}
            srcSet={preview.srcset}
            sizes="33vw"
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="block h-auto w-full object-cover"
          />
        ) : null}
      </div>
    </>
  );
}
