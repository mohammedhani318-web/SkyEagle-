"use client";

import { useState } from "react";
import ProductEditor, { type CourseOption, type ProductValues } from "./ProductEditor";

export default function NewProductEditor({ courses }: { courses: CourseOption[] }) {
  const [initial] = useState<ProductValues>(() => ({
    id: crypto.randomUUID(),
    slug: "",
    kind: "book",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    price: 0,
    image_url: "",
    is_digital: true,
    stock: "",
    course_id: "",
    file_path: "",
    published: false,
  }));
  return <ProductEditor initial={initial} courses={courses} />;
}
