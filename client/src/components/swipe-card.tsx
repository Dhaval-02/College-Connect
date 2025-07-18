import { useState } from "react";
import { User } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Heart, Star } from "lucide-react";

interface SwipeCardProps {
  user: User;
  onSwipe: (userId: number, isRightSwipe: boolean) => void;
  isTop?: boolean;
}

export default function SwipeCard({ user, onSwipe, isTop = false }: SwipeCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  const handleSwipe = (isRightSwipe: boolean) => {
    setIsAnimating(true);
    setAnimationClass(isRightSwipe ? "animate-swipe-right" : "animate-swipe-left");
    
    setTimeout(() => {
      onSwipe(user.id, isRightSwipe);
    }, 500);
  };

  const profilePhoto = user.profilePhotos?.[0] || "/placeholder-avatar.jpg";
  const interests = user.interests || [];

  return (
    <Card
      className={`absolute inset-0 overflow-hidden transition-all duration-300 ${
        isTop ? "z-10 scale-100 opacity-100" : "z-0 scale-95 opacity-50 rotate-1"
      } ${animationClass}`}
    >
      <div className="h-4/5 relative">
        <img
          src={profilePhoto}
          alt={user.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-semibold mb-1">
            {user.name}, {user.age}
          </h3>
          <p className="text-sm opacity-90 mb-2">
            {user.major} • {user.year} • {user.college}
          </p>
          <div className="flex flex-wrap gap-1">
            {interests.slice(0, 3).map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white/20 text-white text-xs"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="h-1/5 p-4 flex items-center">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {user.bio || "Hey there! I'm looking forward to meeting new people on campus."}
        </p>
      </div>
      
      {isTop && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-6">
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full border-2 hover:bg-destructive hover:border-destructive hover:text-white transition-all"
            onClick={() => handleSwipe(false)}
            disabled={isAnimating}
          >
            <X size={20} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-10 h-10 rounded-full border-2 hover:bg-warning hover:border-warning hover:text-white transition-all"
            onClick={() => handleSwipe(true)}
            disabled={isAnimating}
          >
            <Star size={16} />
          </Button>
          <Button
            size="lg"
            className="w-12 h-12 rounded-full bg-accent hover:bg-accent/90 transition-all"
            onClick={() => handleSwipe(true)}
            disabled={isAnimating}
          >
            <Heart size={20} />
          </Button>
        </div>
      )}
    </Card>
  );
}
