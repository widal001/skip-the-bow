import type { GiftSearchParams } from "../content/types";

/**
 * Extracts search parameters from a URL
 */
export function getSearchParamsFromUrl(url: URL): GiftSearchParams {
  return {
    query: url.searchParams.get("q") || undefined,
    categories:
      url.searchParams.get("categories")?.split(",").filter(Boolean) ||
      undefined,
    tags: url.searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
    priceRange: {
      min: url.searchParams.get("min")
        ? Number(url.searchParams.get("min"))
        : undefined,
      max: url.searchParams.get("max")
        ? Number(url.searchParams.get("max"))
        : undefined,
    },
    sortBy: url.searchParams.get("sort") || undefined,
  };
}

/**
 * Extracts search parameters from form data, falling back to current URL params
 */
export function getSearchParamsFromForm(
  formData: FormData,
  currentParams: GiftSearchParams
): GiftSearchParams {
  return {
    query: formData.get("search")?.toString() || currentParams.query,
    categories:
      formData.getAll("category").length > 0
        ? formData.getAll("category").map((v) => v.toString())
        : currentParams.categories,
    tags:
      formData.getAll("tag").length > 0
        ? formData.getAll("tag").map((v) => v.toString())
        : currentParams.tags,
    priceRange: {
      min: formData.get("min-price")?.toString().trim()
        ? Number(formData.get("min-price")?.toString().trim())
        : currentParams.priceRange?.min,
      max: formData.get("max-price")?.toString().trim()
        ? Number(formData.get("max-price")?.toString().trim())
        : currentParams.priceRange?.max,
    },
    sortBy: formData.get("sort")?.toString() || currentParams.sortBy,
  };
}

/**
 * Builds a URL string from search parameters
 */
export function buildUrl(baseUrl: string, params: GiftSearchParams): string {
  const queryParts = [];

  if (params.query) {
    queryParts.push(`q=${encodeURIComponent(params.query)}`);
  }

  if (params.priceRange?.min) {
    queryParts.push(`min=${params.priceRange.min}`);
  }
  if (params.priceRange?.max) {
    queryParts.push(`max=${params.priceRange.max}`);
  }

  if (params.categories?.length) {
    queryParts.push(`categories=${params.categories.join(",")}`);
  }

  if (params.tags?.length) {
    queryParts.push(`tags=${params.tags.join(",")}`);
  }

  if (params.sortBy) {
    queryParts.push(`sort=${params.sortBy}`);
  }

  return queryParts.length > 0 ? `${baseUrl}?${queryParts.join("&")}` : baseUrl;
}
