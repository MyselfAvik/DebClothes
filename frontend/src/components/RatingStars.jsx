import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingStars = ({ rating = 0, count = 0, size = 16, showCount = true }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0 && rating % 1 >= 0.3; // Show half star if fractional part is between 0.3 and 0.9

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <Star
          key={i}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      );
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(
        <StarHalf
          key={i}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      );
    } else {
      stars.push(
        <Star
          key={i}
          size={size}
          className="text-slate-600"
        />
      );
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showCount && (
        <span className="text-xs text-slate-400">
          ({count || 0})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
