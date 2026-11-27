"use client";

import { useState } from "react";
import CourseEditor, { type CourseValues } from "./CourseEditor";

/** نموذج دورة جديدة: المعرّف يُولَّد في المتصفح مرة واحدة */
export default function NewCourseEditor() {
  const [course] = useState<CourseValues>(() => ({
    id: crypto.randomUUID(),
    slug: "",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    level: "beginner",
    access: "free",
    price: 0,
    pass_percent: 70,
    published: false,
  }));
  return <CourseEditor course={course} lessons={[]} questions={[]} existingLessonIds={[]} />;
}
