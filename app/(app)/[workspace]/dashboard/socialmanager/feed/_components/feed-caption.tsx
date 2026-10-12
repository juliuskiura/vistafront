/**
 * A caption with its hashtags pulled out as pills.
 *
 * Not decoration: the prototype shows platform-scoped hashtags because a
 * tailored Instagram caption carries tags the master copy never had, and the
 * only way to see that at a glance is to render the tags as tags. Splitting on
 * whitespace keeps the original ordering and spacing — the text is the
 * platform's copy, so it is shown exactly as written.
 */
export function CaptionWithHashtags({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <p className={className}>
      {text.split(/(\s+)/).map((part, index) => {
        const isHashtag = part.startsWith("#") && part.length > 1;
        return isHashtag ? (
          <span
            key={index}
            className="font-medium text-primary-600"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </p>
  );
}
