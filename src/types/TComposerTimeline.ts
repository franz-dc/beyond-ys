export type TComposerTimeline = {
  games: Record<
    string,
    {
      name: string;
      releaseDate: string;
    }
  >;
  staffMembers: Record<
    string,
    {
      name: string;
      staffType: string;
      firstGame: string;
    }
  >;
  composerTimeline: Record<string, Record<string, string>>;
};
