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
    </Helmet>
  );
}
