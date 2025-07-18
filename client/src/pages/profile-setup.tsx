import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, X } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const profileSchema = z.object({
  major: z.string().min(1, "Please enter your major"),
  year: z.string().min(1, "Please select your year"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be under 500 characters"),
  interests: z.array(z.string()).min(1, "Please add at least one interest"),
});

const years = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function ProfileSetup() {
  const { user, updateProfile, isUpdateProfilePending } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      major: user?.major || "",
      year: user?.year || "",
      bio: user?.bio || "",
      interests: [],
    },
  });

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch("/api/users/upload-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setPhotos([...photos, data.photoUrl]);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updated = [...interests, newInterest.trim()];
      setInterests(updated);
      form.setValue("interests", updated);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    const updated = interests.filter((i) => i !== interest);
    setInterests(updated);
    form.setValue("interests", updated);
  };

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile(
      {
        ...data,
        profilePhotos: photos,
        isProfileComplete: true,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile Complete!",
            description: "Welcome to CampusConnect! You can now start connecting with other students.",
          });
        },
        onError: (error) => {
          toast({
            title: "Profile Update Failed",
            description: error.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Create Your Profile</h2>
          <p className="text-muted-foreground">Let your campus community get to know you</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Complete your profile to start connecting with other students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Photos */}
              <div>
                <Label className="text-base font-semibold">Profile Photos</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload up to 6 photos to show your personality
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Profile ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <label className="aspect-square bg-muted border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                        }}
                      />
                      <div className="text-center">
                        {uploadingPhoto ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              {photos.length === 0 ? "Main Photo" : "Add Photo"}
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    {...form.register("major")}
                  />
                  {form.formState.errors.major && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.major.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select onValueChange={(value) => form.setValue("year", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.year && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.year.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="min-h-[120px]"
                  {...form.register("bio")}
                />
                {form.formState.errors.bio && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              {/* Interests */}
              <div>
                <Label>Interests</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add your interests to help others find common ground
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" variant="outline" onClick={addInterest}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.formState.errors.interests && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.interests.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isUpdateProfilePending}>
                {isUpdateProfilePending ? "Completing Profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
