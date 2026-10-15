import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { communityApi } from "../../api/communityApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";

export default function FollowButton({ userId }) {
  const { isAuthenticated, user } = useAuth();
  const [following, setFollowing] = useState(false);

  const mutation = useMutation({
    mutationFn: () => (following ? communityApi.unfollow(userId) : communityApi.follow(userId)),
    onSuccess: (data) => setFollowing(data.following),
    onError: (err) => toast.error(err.response?.data?.error?.message || "Something went wrong"),
  });

  if (!isAuthenticated || user?._id === userId) return null;

  return (
    <Button variant={following ? "outline" : "primary"} className="text-xs px-3 py-1.5" onClick={() => mutation.mutate()}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
