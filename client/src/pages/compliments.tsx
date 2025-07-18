import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import { User, Compliment } from "@shared/schema";
import { Heart, Send, Sparkles } from "lucide-react";
import Layout from "@/components/layout";

const complimentSchema = z.object({
  toUserId: z.number().min(1, "Please select a person"),
  message: z.string().min(5, "Compliment must be at least 5 characters").max(500, "Compliment must be under 500 characters"),
});

export default function ComplimentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"received" | "send">("received");

  const { data: compliments = [], isLoading: complimentsLoading } = useQuery({
    queryKey: ["/api/compliments"],
    queryFn: async () => {
      const response = await fetch("/api/compliments", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch compliments");
      return response.json() as Promise<(Compliment & { fromUser: User | null })[]>;
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/compliments/users"],
    queryFn: async () => {
      const response = await fetch("/api/compliments/users", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
    enabled: selectedTab === "send",
  });

  const sendComplimentMutation = useMutation({
    mutationFn: async (complimentData: z.infer<typeof complimentSchema>) => {
      const response = await fetch("/api/compliments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(complimentData),
      });
      if (!response.ok) throw new Error("Failed to send compliment");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compliment Sent! ✨",
        description: "Your anonymous compliment has been delivered.",
      });
      form.reset();
      setSelectedTab("received");
      queryClient.invalidateQueries({ queryKey: ["/api/compliments"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Compliment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof complimentSchema>>({
    resolver: zodResolver(complimentSchema),
    defaultValues: {
      toUserId: 0,
      message: "",
    },
  });

  const onSubmit = (data: z.infer<typeof complimentSchema>) => {
    sendComplimentMutation.mutate(data);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const isLoading = complimentsLoading || (selectedTab === "send" && usersLoading);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-campus rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Anonymous Compliments</h2>
          <p className="text-muted-foreground">Spread positivity on campus anonymously</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setSelectedTab("received")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTab === "received"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Received ({compliments.length})
          </button>
          <button
            onClick={() => setSelectedTab("send")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTab === "send"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Send Compliment
          </button>
        </div>

        {selectedTab === "received" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span>Compliments Received</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {compliments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No compliments yet</h3>
                  <p className="text-muted-foreground">
                    When someone sends you a compliment, it will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {compliments.map((compliment, index) => (
                    <div
                      key={compliment.id}
                      className={`rounded-xl p-4 ${
                        index % 2 === 0
                          ? "bg-gradient-to-r from-accent/10 to-success/10"
                          : "bg-gradient-to-r from-success/10 to-accent/10"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-campus rounded-full flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground mb-2">
                            "{compliment.message}"
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatTime(compliment.createdAt)}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              Anonymous
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-accent" />
                <span>Send a Compliment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="toUserId">To</Label>
                  <Select onValueChange={(value) => form.setValue("toUserId", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={user.profilePhotos?.[0]} />
                              <AvatarFallback className="text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name} - {user.major}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.toUserId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.toUserId.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="message">Your Compliment</Label>
                  <Textarea
                    id="message"
                    placeholder="Write something nice..."
                    className="min-h-[100px]"
                    {...form.register("message")}
                  />
                  {form.formState.errors.message && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.message.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-campus hover:from-accent/90 hover:to-success/90 transition-all transform hover:scale-105"
                  disabled={sendComplimentMutation.isPending}
                >
                  {sendComplimentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Anonymously
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
