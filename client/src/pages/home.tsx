import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import { User } from "@shared/schema";
import { Heart, X, Star, Settings, User as UserIcon } from "lucide-react";
import SwipeCard from "@/components/swipe-card";
import Layout from "@/components/layout";

export default function HomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: potentialMatches = [], isLoading } = useQuery({
    queryKey: ["/api/swipe/potential-matches"],
    queryFn: async () => {
      const response = await fetch("/api/swipe/potential-matches", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch matches");
      return response.json() as Promise<User[]>;
    },
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ userId, isRightSwipe }: { userId: number; isRightSwipe: boolean }) => {
      const response = await fetch(`/api/swipe/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isRightSwipe }),
      });
      if (!response.ok) throw new Error("Swipe failed");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.match) {
        toast({
          title: "It's a Match! 🎉",
          description: "You and this person liked each other. Start chatting now!",
        });
      }
      setCurrentIndex((prev) => prev + 1);
    },
    onError: (error) => {
      toast({
        title: "Swipe Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSwipe = (userId: number, isRightSwipe: boolean) => {
    swipeMutation.mutate({ userId, isRightSwipe });
  };

  const currentUser = potentialMatches[currentIndex];
  const nextUser = potentialMatches[currentIndex + 1];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen px-4">
          <Card className="p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for more potential matches from your campus!
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/swipe/potential-matches"] })}>
              Refresh
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-sm mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary">CampusConnect</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <UserIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Swipe Cards */}
        <div className="relative mb-8" style={{ height: "600px" }}>
          {nextUser && (
            <SwipeCard
              key={`${nextUser.id}-next`}
              user={nextUser}
              onSwipe={handleSwipe}
              isTop={false}
            />
          )}
          <SwipeCard
            key={`${currentUser.id}-current`}
            user={currentUser}
            onSwipe={handleSwipe}
            isTop={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center space-x-6">
          <Button
            variant="outline"
            size="lg"
            className="w-14 h-14 rounded-full border-2 hover:bg-destructive hover:border-destructive hover:text-white transition-all"
            onClick={() => handleSwipe(currentUser.id, false)}
            disabled={swipeMutation.isPending}
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full border-2 hover:bg-warning hover:border-warning hover:text-white transition-all"
            onClick={() => handleSwipe(currentUser.id, true)}
            disabled={swipeMutation.isPending}
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 transition-all"
            onClick={() => handleSwipe(currentUser.id, true)}
            disabled={swipeMutation.isPending}
          >
            <Heart className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
