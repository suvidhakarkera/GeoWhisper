# Multi-stage Docker build for Spring Boot application

# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-21 AS build

# Set working directory
WORKDIR /app

# Copy Maven files for dependency caching
COPY pom.xml .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
# Using slim (Debian-based) instead of alpine to avoid glibc compatibility issues with Firebase/gRPC
FROM eclipse-temurin:21-jre-jammy

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Note: Firebase key should be mounted as a volume or passed as environment variable at runtime
# Example: docker run -v /path/to/firebase-key.json:/app/firebase-key.json ...

# Expose the port your application runs on
EXPOSE 8080

# Set environment variables (optional - can be overridden at runtime)
ENV SPRING_PROFILES_ACTIVE=prod

# Run the application with JVM options to avoid native library issues
ENTRYPOINT ["java", \
    "-Dio.netty.native.workdir=/tmp", \
    "-Dfile.encoding=UTF-8", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]

# Optional: Add health check (requires wget to be installed)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1
