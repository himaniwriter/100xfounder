import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db-config";
import {
  createSpotlightFromInvite,
  getFeatureInvite,
  spotlightSubmissionSchema,
} from "@/lib/launch/spotlights";
import { uploadImageFileToSupabase } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type RouteContext = { params: { token: string } };

function readString(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Unavailable" }, { status: 503 });
  }

  const invite = await getFeatureInvite(params.token);
  if (!invite || invite.status === "unsubscribed") {
    return NextResponse.json({ success: false, error: "This invite link is not valid." }, { status: 404 });
  }
  if (invite.spotlight) {
    return NextResponse.json({ success: false, error: "You've already submitted your spotlight." }, { status: 409 });
  }

  const form = await request.formData();
  const parsed = spotlightSubmissionSchema.safeParse({
    founderName: readString(form, "founderName"),
    role: readString(form, "role"),
    location: readString(form, "location"),
    storyOrigin: readString(form, "storyOrigin"),
    storyProblem: readString(form, "storyProblem"),
    storyTraction: readString(form, "storyTraction"),
    storyAdvice: readString(form, "storyAdvice"),
    storyNext: readString(form, "storyNext"),
    twitterUrl: readString(form, "twitterUrl"),
    linkedinUrl: readString(form, "linkedinUrl"),
    instagramHandle: readString(form, "instagramHandle"),
    consentWebsite: readString(form, "consentWebsite") === "on",
    consentInstagram: readString(form, "consentInstagram") === "on",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Please check the form." },
      { status: 400 },
    );
  }

  let photoUrl: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { success: false, error: "Photo must be a JPG, PNG or WebP under 5 MB." },
        { status: 400 },
      );
    }
    try {
      photoUrl = (await uploadImageFileToSupabase(photo, { folder: "spotlights" })).url;
    } catch {
      return NextResponse.json({ success: false, error: "Photo upload failed. Try again." }, { status: 502 });
    }
  }

  const spotlight = await createSpotlightFromInvite(invite.id, parsed.data, photoUrl);
  return NextResponse.json({ success: true, status: spotlight.status });
}
