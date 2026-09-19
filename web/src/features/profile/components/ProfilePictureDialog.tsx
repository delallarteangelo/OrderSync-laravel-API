import * as React from "react";
import { Camera, LoaderCircle, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import { uploadProfilePicture } from "@/shared/api/auth";
import { isApiError } from "@/shared/api/errors";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 4 * 1024 * 1024;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfilePictureDialog({ open, onOpenChange }: Props) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState("");

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetSelection = React.useCallback(() => {
    setFile(null);
    setValidationError("");
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const upload = useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      resetSelection();
      onOpenChange(false);
      toast.success("Profile picture updated");
    },
    onError: (error) => {
      const message = isApiError(error)
        ? (error.fieldErrors?.avatar?.[0] ?? error.message)
        : "Could not update profile picture";
      toast.error(message);
    },
  });

  if (!user) return null;

  const chooseFile = (selected: File | undefined) => {
    setValidationError("");
    if (!selected) return;
    if (!allowedTypes.has(selected.type)) {
      resetSelection();
      setValidationError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > maxBytes) {
      resetSelection();
      setValidationError("The image must be 4 MB or smaller.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (upload.isPending) return;
    if (!nextOpen) resetSelection();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile picture</DialogTitle>
          <DialogDescription>Choose a new picture for your OrderSync account.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <Avatar className="h-28 w-28 border">
            <AvatarImage
              src={previewUrl ?? user.avatarUrl}
              alt={`${user.fullName}'s profile picture`}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-2xl text-primary">
              {initialsOf(user.fullName)}
            </AvatarFallback>
          </Avatar>

          <input
            ref={inputRef}
            aria-label="Choose profile picture"
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Camera className="mr-2 h-4 w-4" />
            Choose picture
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            JPG, PNG, or WebP · maximum 4 MB · at least 64 × 64 pixels
          </p>
          {file && <p className="max-w-full truncate text-sm font-medium">{file.name}</p>}
          {validationError && (
            <p role="alert" className="text-center text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!file || upload.isPending}
            onClick={() => file && upload.mutate(file)}
          >
            {upload.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {upload.isPending ? "Uploading…" : "Save picture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
