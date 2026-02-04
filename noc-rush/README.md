# NOC Rush

A browser-based Network Engineering simulator.

## Setup Instructions

Since this is a new sub-project, you need to install its dependencies separately.

1. Open a terminal in this folder:
   ```bash
   cd noc-rush
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   *If `npm install` fails due to strict peer deps or conflicts, try `npm install --legacy-peer-deps`*

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173/noc-rush/` in your browser.

## Features
- **CLI**: A simulated terminal allowing basic commands like `show ip interface brief`.
- **Topology**: A visualization of the network graph (R1, R2, SW1).
- **Engine**: Basic session management and mock state.

## Deployment to GitHub Pages
The project is configured to deploy to `https://yasinenginexpert.github.io/noc-rush/`.
Build with:
```bash
npm run build
```
Then commit the `dist` folder or use a GitHub Action.
