import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

interface UserProfileProps {
  name: string;
  avatarUrl: string | null;
}

export function UserProfile({ name, avatarUrl }: UserProfileProps) {
  // Generate initials from name with safety for edge cases
  // - Trim whitespace and handle empty names
  // - Split by spaces
  // - Take first letter of each non-empty part
  // - Join and uppercase
  // - Limit to 2 characters max
  // - Fallback to "?" if no valid initials
  const initials = useMemo(() => {
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return "?";
    }

    const parts = trimmedName
      .split(/\s+/) // Split by one or more whitespace
      .filter((part) => part.length > 0); // Remove empty parts

    if (parts.length === 0) {
      return "?";
    }

    return parts
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  return (
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label="User profile"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatarUrl || undefined} alt={`${name}'s avatar`} />
        <AvatarFallback aria-label={`${name}'s initials`}>{initials}</AvatarFallback>
      </Avatar>
      <span className="font-medium truncate max-w-[150px]">{name}</span>
    </div>
  );
}
