import { BlogPostEditor } from "@/components/admin/blog-post-editor";

type AdminEditBlogPostPageProps = {
  params: {
    slug: string;
  };
};

export default function AdminEditBlogPostPage({ params }: AdminEditBlogPostPageProps) {
  return <BlogPostEditor slug={params.slug} />;
}
