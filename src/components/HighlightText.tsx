import React from 'react';

interface HighlightTextProps {
  text: string;
  search: string;
}

export default function HighlightText({ text, search }: HighlightTextProps) {
  if (!search || !search.trim()) {
    return <>{text}</>;
  }

  try {
    // Escape regex characters safely to avoid crashing on special keys
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === search.toLowerCase();
          return isMatch ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-400 text-gray-950 font-bold px-0.5 rounded shadow-xs"
            >
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  } catch (err) {
    // Fail-safe returns unhighlighted text if regex parsing encounters issues
    return <>{text}</>;
  }
}
