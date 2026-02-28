import { buildInternalLinkGraph, type InternalLinkContext } from "@/lib/seo/internal-link-graph";
import { ContextualLinkCluster } from "@/components/seo/contextual-link-cluster";

type PillarCrosslinksProps = {
  context: InternalLinkContext;
  maxLinks?: number;
  includeGlobal?: boolean;
  title?: string;
  description?: string;
  className?: string;
};

export function PillarCrosslinks({
  context,
  maxLinks = 10,
  includeGlobal = false,
  title,
  description,
  className,
}: PillarCrosslinksProps) {
  const links = buildInternalLinkGraph(context, {
    maxLinks,
    includeGlobal,
  });

  return (
    <ContextualLinkCluster
      links={links}
      title={title}
      description={description}
      className={className}
    />
  );
}
