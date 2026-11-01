# syntax=docker/dockerfile:1
# Back-end image for compose.yaml. Build context: backend/.
# Tests are not run here: `pnpm check` runs them in `mvnw verify`.

FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp dependency:go-offline
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp package -DskipTests \
    && cp target/divenet-backend-*.jar /app.jar

FROM eclipse-temurin:25-jre
# curl is for the compose health check. /data/media is the MEDIA_DIR volume: a new named
# volume takes this folder's owner, so the app can write uploads to it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 divenet \
    && mkdir -p /data/media \
    && chown divenet /data/media
COPY --from=build /app.jar /app/app.jar
USER divenet
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
