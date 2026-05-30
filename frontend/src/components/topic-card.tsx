'use client';
import { getTagColor, normalizeKnownTags, parseTags } from '@/lib/tag-colors';
import Link from 'next/link';

interface Props {
  topic: any;
  onRequireAuth?: () => void;
}

export function TopicCard({ topic }: Props) {
  const tags = normalizeKnownTags(topic.tags);
  const displayTags = tags.length > 0 ? tags : parseTags(topic.tags);

  return (
    <Link href={`/topic/${topic.id}`}
      className="block bg-white rounded-apple-lg p-5 shadow-sm hover:shadow-md transition-shadow press-effect">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{topic.title}</h3>
          {topic.titleZh && <p className="text-sm text-gray-500 mt-0.5">{topic.titleZh}</p>}
          <p className="text-xs text-gray-400 mt-1">{topic.eventDate}</p>
        </div>
        {displayTags.length > 0 && (
          <div className="flex gap-1.5 ml-3">
            {displayTags.map((tag: string) => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(tag.trim())}`}>
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
