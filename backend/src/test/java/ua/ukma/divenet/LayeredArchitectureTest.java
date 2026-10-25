package ua.ukma.divenet;

import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * ADR-0008: inside every feature package, {@code web -> service -> domain}, and web code never touches
 * entities or repositories. {@code shared} is cross-cutting and outside the layers.
 */
@AnalyzeClasses(packages = "ua.ukma.divenet", importOptions = ImportOption.DoNotIncludeTests.class)
class LayeredArchitectureTest {

    private static final String BASE = "ua.ukma.divenet.";

    @ArchTest
    static final ArchRule featureLayersPointDownwards = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            // No feature package exists yet; without this, empty layers fail the rule.
            .withOptionalLayers(true)
            .layer("Web")
            .definedBy(featureLayer("web"))
            .layer("Service")
            .definedBy(featureLayer("service"))
            .layer("Domain")
            .definedBy(featureLayer("domain"))
            .whereLayer("Web")
            .mayNotBeAccessedByAnyLayer()
            .whereLayer("Service")
            .mayOnlyBeAccessedByLayers("Web")
            .whereLayer("Domain")
            .mayOnlyBeAccessedByLayers("Service");

    /** Classes in {@code ua.ukma.divenet.<feature>.<layer>..}, excluding {@code shared}. */
    private static DescribedPredicate<JavaClass> featureLayer(String layer) {
        return new DescribedPredicate<>("feature " + layer + " packages") {
            @Override
            public boolean test(JavaClass javaClass) {
                String pkg = javaClass.getPackageName();
                if (!pkg.startsWith(BASE) || pkg.startsWith(BASE + "shared")) {
                    return false;
                }
                String[] parts = pkg.substring(BASE.length()).split("\\.");
                return parts.length >= 2 && parts[1].equals(layer);
            }
        };
    }
}
