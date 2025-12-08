# Use Node.js 20 LTS as the base image for compilation and runtime
FROM node:20-slim as build-stage

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package*.json ./

# Install project dependencies, including dev dependencies for the build step
RUN npm ci

# Copy all application source code
COPY . .

# Build the TypeScript project
# This will compile your .ts files into .js files, typically in a 'dist' directory
RUN npm run build

# --- Production Stage ---
# Start a new, smaller base image for the final production container
# This helps reduce the final image size as it doesn't include build tools
FROM node:20-slim as production-stage

# Set the working directory for the production application
WORKDIR /app

# Copy only production dependencies from the build stage
# This ensures a minimal node_modules with only what's needed at runtime
COPY --from=build-stage /app/package*.json ./
RUN npm ci --omit=dev --no-audit && npm cache clean --force

# Copy the compiled application code from the build stage's 'dist' directory
COPY --from=build-stage /app/dist ./dist

# Expose the port your application listens on. Cloud Run will inject PORT environment variable.
# It's good practice to expose it, even though Cloud Run usually manages this.
EXPOSE 8080

# Set NODE_ENV to production for optimized Node.js runtime behavior
ENV NODE_ENV=production

# Health check command for Cloud Run.
# This checks if the /health endpoint returns a 200 status code.
# Adjust the path '/health' if your application uses a different health check endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Define the command to run your application.
# This assumes your main compiled entry point is 'dist/main.js'.
# Cloud Run will use this command when starting your container.
CMD ["node", "dist/index.js"]
