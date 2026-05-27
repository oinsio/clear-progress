# Clear Progress — Backend Deployment

Google Apps Script backend with clasp deployment.

## Initial Setup

### 1. Install clasp

```bash
pnpm add -g @google/clasp
clasp login
```

### 2. Create Apps Script project

Option A — via browser:
- Open [script.google.com](https://script.google.com)
- Create new project
- Project Settings → copy Script ID

Option B — via clasp:
```bash
cd backend
clasp create --name "Clear Progress Backend" --type webapp
```

### 3. Configure environment

```bash
# Clone existing project (creates .clasp.json automatically)
clasp clone <scriptId> --rootDir .

# Or copy template and fill in scriptId manually
cp .clasp.json.example .clasp.json

# Create .env for deployment IDs
cp .env.example .env
```

### 4. First deployment

```bash
# Make script executable
chmod +x deploy.sh

# Create dev deployment
./deploy.sh deploy:new dev
# → Copy deployment ID to .env → DEPLOY_ID_DEV

# Create qa deployment
./deploy.sh deploy:new qa
# → Copy deployment ID to .env → DEPLOY_ID_QA

# Create prod deployment
./deploy.sh deploy:new prod
# → Copy deployment ID to .env → DEPLOY_ID_PROD
```

## Daily Usage

```bash
# Push code without deploying (for syntax check)
./deploy.sh push

# Deploy to dev
./deploy.sh deploy dev

# Deploy to prod (will ask for confirmation)
./deploy.sh deploy prod

# Check availability
./deploy.sh ping dev
./deploy.sh ping prod

# View deployment list
./deploy.sh status

# Open editor in browser
./deploy.sh open

# View execution logs
./deploy.sh logs
```

## File Structure

```
backend/
├── deploy.sh            # Deployment script
├── appsscript.json      # GAS manifest (scopes, runtime)
├── .clasp.json          # clasp config (do not commit!)
├── .clasp.json.example  # Config template
├── .env                 # Environment variables (do not commit!)
├── .env.example         # Variables template
├── .gitignore           # Git exclusions
└── src/                 # TypeScript sources (GAS)
    └── ...
```

## Environments

| Environment | Purpose                   | Variable         |
|-------------|---------------------------|------------------|
| dev         | Development and testing   | `DEPLOY_ID_DEV`  |
| qa          | QA / PR review            | `DEPLOY_ID_QA`   |
| prod        | Production                | `DEPLOY_ID_PROD` |

Each environment is a separate deployment ID within a single Apps Script project.
Same code, different URLs.

## Important Notes

- **URL does not change** when updating existing deployment (`deploy`), only when creating new one (`deploy:new`)
- **`clasp push`** overwrites ALL files in project — ensure everything needed is in `rootDir`
- **TypeScript** is compiled automatically by clasp on push
- **`.env` and `.clasp.json` are not committed** — contain secrets
