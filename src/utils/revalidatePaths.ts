export const revalidatePaths = async (paths: string[], token: string) => {
  await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?` +
      new URLSearchParams({
        paths: paths.join(','),
      }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
