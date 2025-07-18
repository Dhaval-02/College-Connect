import { Link, useLocation } from "wouter";
import { Heart, Home, Calendar, MessageCircle, User } from "lucide-react";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/compliments", icon: Heart, label: "Compliments" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path || (path === "/" && location === "/home");
            return (
              <Link key={path} href={path}>
                <button
                  className={`p-3 rounded-xl transition-all ${
                    isActive
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  <Icon size={20} />
                  <span className="sr-only">{label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
