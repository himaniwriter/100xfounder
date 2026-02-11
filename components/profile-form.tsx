"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { updateFounderProfile } from "@/actions/update-profile";

type ProfileFormValues = {
  name: string;
  bio: string;
  linkedinUrl: string;
};

type ProfileFormProps = {
  defaultValues?: Partial<ProfileFormValues>;
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      bio: defaultValues?.bio ?? "",
      linkedinUrl: defaultValues?.linkedinUrl ?? "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitError(null);
    setSaved(false);

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("bio", values.bio);
    formData.append("linkedinUrl", values.linkedinUrl);

    const result = await updateFounderProfile(formData);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    setSaved(true);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-200">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[#6366f1]/60"
          placeholder="Your full name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name ? (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium text-zinc-200">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[#6366f1]/60"
          placeholder="Tell people what you are building"
          {...register("bio", { maxLength: { value: 400, message: "Bio must be 400 characters or less" } })}
        />
        {errors.bio ? (
          <p className="text-xs text-red-400">{errors.bio.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="linkedinUrl" className="text-sm font-medium text-zinc-200">
          LinkedIn URL
        </label>
        <input
          id="linkedinUrl"
          type="url"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[#6366f1]/60"
          placeholder="https://linkedin.com/in/your-handle"
          {...register("linkedinUrl", {
            pattern: {
              value: /^$|^https?:\/\/(www\.)?linkedin\.com\/.+/i,
              message: "Enter a valid LinkedIn URL",
            },
          })}
        />
        {errors.linkedinUrl ? (
          <p className="text-xs text-red-400">{errors.linkedinUrl.message}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {submitError ? (
            <p className="text-sm text-red-400">{submitError}</p>
          ) : null}
          {saved ? <p className="text-sm text-emerald-400">Profile updated successfully.</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </form>
  );
}
