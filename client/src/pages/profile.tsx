import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";
import { colleges } from "@/lib/colleges";
import { Camera, Edit3, Plus, X, Settings, LogOut, User, Heart, Calendar, MessageCircle } from "lucide-react";
import Layout from "@/components/layout";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  major: z.string().min(1, "Please enter your major"),
  year: z.string().min(1, "Please select your year"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be under 500 characters"),
  college: z.string().min(1, "Please select your college"),
});

const years = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function ProfilePage() {
  const { user, updateProfile, logout, isUpdateProfilePending } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>(user?.profilePhotos || []);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [newInterest, setNewInterest] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      major: user?.major || "",
      year: user?.year || "",
      bio: user?.bio || "",
      college: user?.college || "",
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
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile(
      {
        ...data,
        profilePhotos: photos,
        interests,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile Updated!",
            description: "Your profile has been updated successfully.",
          });
          setIsEditDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Update Failed",
            description: error.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-primary">Profile</h2>
          <div className="flex items-center space-x-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Profile Photos */}
                  <div>
                    <Label className="text-sm font-medium">Profile Photos</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={photo}
                            alt={`Profile ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {photos.length < 6 && (
                        <label className="aspect-square bg-muted border border-dashed border-border rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(file);
                            }}
                          />
                          {uploadingPhoto ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                          ) : (
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="major">Major</Label>
                      <Input
                        id="major"
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
                      <Select onValueChange={(value) => form.setValue("year", value)} defaultValue={user.year || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
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

                  <div>
                    <Label htmlFor="college">College</Label>
                    <Select onValueChange={(value) => form.setValue("college", value)} defaultValue={user.college}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college} value={college}>
                            {college}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.college && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.college.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      className="min-h-[80px]"
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
                    <div className="flex flex-wrap gap-1 mt-2 mb-2">
                      {interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add interest"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addInterest}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isUpdateProfilePending}>
                    {isUpdateProfilePending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to login again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.profilePhotos?.[0]} />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-primary mb-1">
                {user.name}, {user.age}
              </h3>
              <p className="text-muted-foreground mb-3">
                {user.major} • {user.year}
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                {user.college}
              </p>
              {user.bio && (
                <p className="text-sm text-foreground mb-4">
                  {user.bio}
                </p>
              )}
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {user.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {user.profilePhotos && user.profilePhotos.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {user.profilePhotos.slice(1).map((photo, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={photo}
                      alt={`Profile ${index + 2}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Matches</p>
              <p className="text-lg font-bold text-primary">
                {user.swipedRight?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-lg font-bold text-primary">-</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-lg font-bold text-primary">-</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-muted-foreground">Manage your privacy preferences</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Manage notification preferences</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account</p>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
