import { notFound } from "next/navigation";
import ErrorPreviewClient from "./ErrorPreviewClient";

export default function ErrorPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <ErrorPreviewClient />;
}
