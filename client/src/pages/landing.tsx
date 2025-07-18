import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Heart, Calendar, Shield, GraduationCap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-primary">CampusConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-5xl sm:text-6xl font-bold text-primary mb-6 leading-tight">
              Connect with your
              <span className="text-accent"> campus community</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              The exclusive social platform designed for college students. Meet, match, and build meaningful connections within your university community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-accent hover:bg-accent/90 transition-all transform hover:scale-105">
                  Start Connecting
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="transition-all">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Campus Exclusive</h3>
              <p className="text-muted-foreground">
                Connect only with verified students from your university community for authentic relationships.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Campus Events</h3>
              <p className="text-muted-foreground">
                Discover and join local events, study groups, and social gatherings happening on campus.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Advanced safety features and anonymous reporting keep your campus community protected.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Card className="bg-gradient-campus text-white">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold mb-4">Ready to connect?</h3>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of students already building meaningful relationships on campus.
            </p>
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Get Started Today
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
