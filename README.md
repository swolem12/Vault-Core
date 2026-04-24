# Vault-Core

Vault-Core is the repo for the PrintForge Ops webapp and supporting source package.

## Stack

- React
- TypeScript
- Vite
- GitHub Pages for static deployment

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vendor Library Refresh

```bash
npm run build:vendor-libraries
```

This regenerates the official-source material library files in [data/vendor-libraries](C:\Users\User\Desktop\3D%20management\Vault-Core\data\vendor-libraries).

## GitHub Pages

The app is configured for project-pages deployment from this repository using the `/Vault-Core/` base path.

On GitHub, make sure Pages is set to use **GitHub Actions** as the deployment source.

