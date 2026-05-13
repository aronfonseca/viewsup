import { Helmet } from "react-helmet-async";

const BASE_URL = "https://viewsup.lovable.app";

interface PageHelmetProps {
  title: string;
  description?: string;
  path: string;
}

export function PageHelmet({ title, description, path }: PageHelmetProps) {
  const canonical = `${BASE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
}
