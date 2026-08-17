import { splitLinkified } from "@/lib/forum";

function LinkifiedLine({ text }: { text: string }) {
  return (
    <>
      {splitLinkified(text).map((part, index) =>
        part.type === "link" ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noreferrer"
            className="text-forum-blue underline underline-offset-2"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

export function PostBody({ body }: { body: string }) {
  const lines = body.split("\n");
  return (
    <div className="text-app-body text-body leading-7 whitespace-pre-wrap">
      {lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? "\n" : null}
          <LinkifiedLine text={line} />
        </span>
      ))}
    </div>
  );
}
