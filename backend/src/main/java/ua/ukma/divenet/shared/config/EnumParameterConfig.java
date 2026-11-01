package ua.ukma.divenet.shared.config;

import java.util.Locale;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Binds enum request parameters by name ignoring case, so {@code sort=rating} reaches {@code RATING}.
 * An unknown name still fails conversion and answers 400.
 */
@Configuration(proxyBeanMethods = false)
class EnumParameterConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(new CaseInsensitiveEnumConverterFactory());
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static final class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

        @Override
        public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
            return source -> (T) Enum.valueOf(targetType, source.strip().toUpperCase(Locale.ROOT));
        }
    }
}
