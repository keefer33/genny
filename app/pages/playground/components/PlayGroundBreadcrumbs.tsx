import { Anchor, Breadcrumbs, Group, Text } from "@mantine/core";
import { RiAiGenerate2, RiArrowRightSLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { Link } from "react-router";

const breadcrumbStyles = {
  breadcrumb: { textTransform: "none" as const, textDecoration: "none" as const },
};

export type PlayGroundBreadcrumbsProps = {
  /** Route segment for brand (e.g. slug), not encoded. */
  brandSegment: string;
  /** Required when `depth` is `product` or `run`. */
  productSegment?: string;
  /** Final crumb on the run page (variant id string or model name). */
  variantLabel?: string;
  depth: "brand" | "product" | "run";
};

/**
 * Playground route breadcrumbs: `/playground`, brand, optional product link, optional terminal text.
 */
export function PlayGroundBreadcrumbs({
  brandSegment,
  productSegment = "",
  //variantLabel,
  depth,
}: PlayGroundBreadcrumbsProps) {
  const separator = <RiArrowRightSLine size={20} />;

  const playgroundCrumb = (
    <Anchor key="playground" component={Link} to="/playground">
      <Group gap="xs">
        <RiAiGenerate2 size={30} />
      </Group>
    </Anchor>
  );

  const brandCrumbLink = (
    <Anchor
      key="brand-link"
      component={Link}
      to={`/playground/${encodeURIComponent(brandSegment)}`}
    >
      {brandSegment || "Brand"}
    </Anchor>
  );

  let children: ReactNode[];

  if (depth === "brand") {
    children = [playgroundCrumb, <Text key="brand-current">{brandSegment || "Brand"}</Text>];
  } else if (depth === "product") {
    children = [
      playgroundCrumb,
      brandCrumbLink,
      <Text key="product-current">{productSegment || "Product"}</Text>,
    ];
  } else {
    children = [
      playgroundCrumb,
      brandCrumbLink,
      <Anchor
        key="product-link"
        component={Link}
        to={`/playground/${encodeURIComponent(brandSegment)}/${encodeURIComponent(productSegment)}`}
      >
        {productSegment || "Product"}
      </Anchor>,
      //<Text key="variant-current">{variantLabel?.trim() || "Run"}</Text>,
    ];
  }

  return (
    <Breadcrumbs styles={breadcrumbStyles} separator={separator} separatorMargin="1">
      {children}
    </Breadcrumbs>
  );
}
