import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateNewsroomPaths(slug?: string): void {
  revalidateTag("blog-posts-published");
  revalidatePath("/blog");
  revalidatePath("/topics");
  revalidatePath("/funding-rounds");
  revalidatePath("/news-sitemap.xml");
  revalidatePath("/ai-sitemap-news.xml");
  revalidatePath("/rss.xml");
  revalidatePath("/atom.xml");

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}
