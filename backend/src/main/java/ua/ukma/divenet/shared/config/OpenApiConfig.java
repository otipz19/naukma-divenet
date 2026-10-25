package ua.ukma.divenet.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/** Fixed metadata keeps the committed api/openapi.json free of ports and build versions. */
@Configuration(proxyBeanMethods = false)
@OpenAPIDefinition(info = @Info(title = "DiveNet API", version = "v1"), servers = @Server(url = "/"))
class OpenApiConfig {}
