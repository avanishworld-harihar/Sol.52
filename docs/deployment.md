# Deployment setup

## Application deployment

This repository is ready for GitHub-based deployments. Link the repository to a
Vercel project once:

1. In Vercel, select **Add New → Project** and import
   `avanishworld-harihar/Sol.52`.
2. Keep the detected Next.js settings (`npm run build`, output directory empty).
3. Add every production value from `.env.local` in Vercel under **Settings →
   Environment Variables**. Do not upload `.env.local` to GitHub.
4. Set `main` as the Production Branch.

After this one-time connection, every push to `main` deploys the production app;
pull requests receive preview deployments. GitHub Actions also runs type-checking
and a production build before changes are merged.

## Supabase database migrations

Database changes are intentionally separate from web-app deployment. In GitHub:

1. Create an environment named `production` and add required reviewers.
2. Add the `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` secrets to that
   environment.
3. Run **Actions → Deploy Supabase migrations**, enter `DEPLOY`, and approve the
   environment request.

This manual approval prevents an accidental SQL migration from being applied to
the live customer database as a side effect of every app commit.
