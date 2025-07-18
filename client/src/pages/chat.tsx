import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { Match, Message, User } from "@shared/schema";
import { ArrowLeft, Send, Camera, MoreVertical, Heart } from "lucide-react";
import Layout from "@/components/layout";

export default function ChatPage() {
  const { matchId } = useParams<{ matchId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, isConnected } = useWebSocket();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const response = await fetch("/api/matches", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch matches");
      return response.json() as Promise<(Match & { otherUser: User })[]>;
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/matches", matchId, "messages"],
    queryFn: async () => {
      if (!matchId) return [];
      const response = await fetch(`/api/matches/${matchId}/messages`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json() as Promise<(Message & { sender: User })[]>;
    },
    enabled: !!matchId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!matchId) throw new Error("No match selected");
      const response = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      // Real-time update will be handled by WebSocket
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !matchId) return;
    
    if (isConnected) {
      sendMessage(parseInt(matchId), newMessage.trim());
      setNewMessage("");
    } else {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (matchesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  // No match selected - show matches list
  if (!matchId) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-2xl font-bold text-primary">Messages</h2>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {matches.length}
            </Badge>
          </div>

          {matches.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground">
                Start swiping to find your perfect match!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link key={match.id} href={`/chat/${match.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={match.otherUser.profilePhotos?.[0]} />
                        <AvatarFallback>
                          {match.otherUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">
                          {match.otherUser.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {match.otherUser.major} • {match.otherUser.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const currentMatch = matches.find((m) => m.id === parseInt(matchId));

  if (!currentMatch) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Match not found</h3>
            <Link href="/chat">
              <Button>Back to Messages</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-border p-4 flex items-center space-x-3">
        <Link href="/chat">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Avatar>
          <AvatarImage src={currentMatch.otherUser.profilePhotos?.[0]} />
          <AvatarFallback>
            {currentMatch.otherUser.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-primary">
            {currentMatch.otherUser.name}
          </h3>
          <p className="text-sm text-success">
            {isConnected ? "Online" : "Offline"}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-primary mb-2">
              You matched with {currentMatch.otherUser.name}!
            </h3>
            <p className="text-muted-foreground text-sm">
              Start the conversation and get to know each other
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? "bg-accent text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-white/75" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Camera className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
