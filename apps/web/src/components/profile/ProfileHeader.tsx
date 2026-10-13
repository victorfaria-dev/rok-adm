// Profile header: banner, then the header card (level 2) over the section (level 1). Shared by the
// public view (/u/) and the edit page preview.
import type { AchievementRow, ProfileRow } from "../../lib/auth/database.types";
import { LEVEL_LABEL } from "../../lib/auth/verification";
import "./profile.css";

interface Props {
  profile: Pick<ProfileRow, "handle" | "display_name" | "bio" | "kingdom_number"> & { verified_level?: ProfileRow["verified_level"] };
  avatarUrl: string | null;
  bannerUrl: string | null;
  achievements?: readonly AchievementRow[];
  /** Buttons under the card (report/block, edit). */
  children?: preact.ComponentChildren;
  /** Heading level for the name: h1 on /u/, h2 inside the edit page. */
  as?: "h1" | "h2";
}

export function initials(name: string | null, handle: string | null): string {
  const src = (name || handle || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0]![0]}${parts[1]![0]}` : src.slice(0, 2);
  return letters.toUpperCase();
}

export function ProfileHeader({ profile, avatarUrl, bannerUrl, achievements = [], children, as: H = "h1" }: Props) {
  const name = profile.display_name || (profile.handle ? `@${profile.handle}` : "New player");
  return (
    <section class="pf-section" aria-labelledby="pf-name">
      <div class="pf-banner" data-empty={bannerUrl ? undefined : ""}>
        {bannerUrl && <img src={bannerUrl} alt="" width={1500} height={500} decoding="async" />}
      </div>
      <div class="pf-card">
        <div class="pf-avatar" aria-hidden={avatarUrl ? undefined : "true"}>
          {avatarUrl ? <img src={avatarUrl} alt={`Photo of ${name}`} width={256} height={256} decoding="async" /> : <span>{initials(profile.display_name, profile.handle)}</span>}
        </div>
        <div class="pf-id">
          <H id="pf-name" class="pf-name">{name}</H>
          <p class="pf-meta">
            {profile.handle && <span class="mono">@{profile.handle}</span>}
            {profile.kingdom_number !== null && <span>Kingdom <span class="mono">#{profile.kingdom_number}</span></span>}
          </p>
          {profile.verified_level !== undefined && (
            <span class="pf-badge pf-verified" data-kind={profile.verified_level > 1 ? "site" : "unverified"} data-verified-level={profile.verified_level}
              title={profile.verified_level === 3 ? "A moderator saw this site's one-time code in the player's in-game Album." : profile.verified_level === 2 ? "A moderator checked the player's screenshots." : "Nothing checked yet: values are what the player typed."}>
              {LEVEL_LABEL[profile.verified_level]}
            </span>
          )}
        </div>
        {profile.bio && <p class="pf-bio">{profile.bio}</p>}
        {children && <div class="pf-actions">{children}</div>}
      </div>
      <div class="pf-body">
        <h2 class="pf-h">Achievements</h2>
        {achievements.length === 0 ? (
          <p class="pf-muted">No achievements yet.</p>
        ) : (
          <ul class="pf-achievements">
            {achievements.map((a) => (
              <li key={a.id} class="pf-achievement" data-source={a.source}>
                <span class="pf-ach-title">{a.title}</span>
                {a.detail && <span class="pf-ach-detail">{a.detail}</span>}
                <span class="pf-badge" data-kind={a.source === "site" ? "site" : "unverified"}>
                  {a.source === "site" ? "Earned on KingdomOps" : "Unverified (self-declared)"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p class="pf-muted pf-fine">KingdomOps cannot read game data. "Unverified" achievements are what the player typed; only "Earned on KingdomOps" ones are checked by the site.</p>
      </div>
    </section>
  );
}
