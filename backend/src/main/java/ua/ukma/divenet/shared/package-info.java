/**
 * Cross-cutting infrastructure: error handling, pagination, clock, OpenAPI configuration.
 *
 * <p>An open module, so every other module may use its subpackages. Keep domain logic out of it.
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package ua.ukma.divenet.shared;

import org.springframework.modulith.ApplicationModule;
