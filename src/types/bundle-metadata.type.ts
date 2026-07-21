// obsidian bases does not return proprty of type list as arrays
export type BundleBaseMetadata = {
  title: string;
  path: string;
  folder: string;
  description: string;
  triggers: string | null;
  parent: string | null;
};

export type BundleProperties = {
  title: string;
  path: string;
  folder: string;
  description: string;
  triggers: string[];
  parent: string | null;
};
export type BundleMetadata = {
  parentFolder: string | null;
} & BundleProperties;
