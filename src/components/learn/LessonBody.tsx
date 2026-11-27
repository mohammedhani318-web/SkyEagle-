import { paragraphs, parseVideo } from "@/lib/db-text";

export default function LessonBody({ body, videoUrl }: { body: string; videoUrl: string | null }) {
  const video = parseVideo(videoUrl);
  return (
    <div className="space-y-5">
      {video?.kind === "iframe" && (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={video.src}
            title="video"
            className="h-full w-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {video?.kind === "file" && (
        <video src={video.src} controls preload="metadata" className="w-full rounded-xl bg-black" />
      )}
      <div className="space-y-4 text-lg leading-loose text-navy-900">
        {paragraphs(body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
