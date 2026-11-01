package ua.ukma.divenet.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Runs {@code @Scheduled} jobs, such as the media cleanup. The app is single-node (ADR-0006). */
@Configuration(proxyBeanMethods = false)
@EnableScheduling
class SchedulingConfig {}
