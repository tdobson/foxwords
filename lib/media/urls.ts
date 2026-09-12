/**
 * URL generation for public play route media serving
 */

export function getPublicPlayMediaUrl(playToken: string, assetId: string): string {
  return `/api/play/${encodeURIComponent(playToken)}/media/${encodeURIComponent(assetId)}`;
}

export function getParentMediaUrl(profileId: string, assetId: string): string {
  return `/api/profiles/${encodeURIComponent(profileId)}/media/${encodeURIComponent(assetId)}`;
}
